document.addEventListener('DOMContentLoaded', function() {
    // Correção: Removida a sintaxe incorreta (o ponto e vírgula extra)
    const form = document.getElementById('whatsapp-form');
    const numeroWhatsApp = '5574988391514'; // Número de WhatsApp da Nilma
    
    // Elementos do DOM para interação
    const selectableItems = document.querySelectorAll('.js-selectable-item');
    const resumoTexto = document.getElementById('resumo-texto');
    
    // Objeto para armazenar o estado do pedido. Usaremos Map para manter a ordem de inserção.
    const pedidoSelecionado = new Map();

    // Função para atualizar o resumo na interface do usuário
    function updateResumo() {
        let resumo = '';
        
        if (pedidoSelecionado.size === 0) {
            resumoTexto.textContent = 'Nenhum item de menu selecionado ainda. Clique nos itens nas seções acima para começar!';
            return;
        }

        let currentCategory = '';
        
        // Itera sobre o mapa para construir o resumo
        pedidoSelecionado.forEach((item, category) => {
            // Se a categoria mudou, adiciona um cabeçalho
            if (category !== currentCategory) {
                resumo += `\n**${category}:**\n`;
                currentCategory = category;
            }
            
            // Adiciona o item selecionado
            resumo += `\t- ${item}\n`;
        });
        
        resumoTexto.textContent = resumo.trim();
    }

    // Função que gerencia o clique nos itens de menu
    function handleItemClick(event) {
        const itemElement = event.currentTarget;
        const category = itemElement.getAttribute('data-category');
        const item = itemElement.getAttribute('data-item');

        // Toggle (Alternar) a classe de seleção
        itemElement.classList.toggle('is-selected');

        if (itemElement.classList.contains('is-selected')) {
            // Item SELECIONADO: Adiciona ou atualiza no Map
            
            // Lógica de exclusividade para TAMANHOS (Apenas um tamanho pode ser selecionado)
            if (category.includes('Tamanho Bolo')) {
                // Desmarca outros itens da mesma categoria de tamanho (Redondo ou Retangular)
                document.querySelectorAll(`.js-selectable-item[data-category^="Tamanho Bolo"].is-selected`).forEach(el => {
                    if (el !== itemElement) {
                        el.classList.remove('is-selected');
                        const otherCategory = el.getAttribute('data-category');
                        pedidoSelecionado.delete(otherCategory);
                    }
                });

                // Como queremos que apenas UM TAMANHO fique no pedido, removemos a categoria antiga e adicionamos a nova.
                // Isso garante que se ele clicar em redondo, remova o retangular, e vice-versa.
                pedidoSelecionado.set('Tamanho do Bolo', item); 
                
            } else {
                // Para Massas, Recheios e Salgados, apenas adiciona o item
                // Se a categoria já existe, transforma em lista ou adiciona. 
                // Para simplificar, vou permitir múltiplos itens na mesma categoria, separando por vírgula ou nova entrada.

                // Verifica se já existem itens desta categoria e transforma em um array para adicionar
                if (pedidoSelecionado.has(category)) {
                    // Se o valor for uma string (item único), transforma em array
                    let existingItems = pedidoSelecionado.get(category);
                    if (!Array.isArray(existingItems)) {
                        existingItems = [existingItems];
                    }
                    existingItems.push(item);
                    pedidoSelecionado.set(category, existingItems);

                } else if (category.includes('Massa')) {
                    // Regra de Negócio: Apenas uma massa por bolo
                     document.querySelectorAll(`.js-selectable-item[data-category="Massa"].is-selected`).forEach(el => {
                        if (el !== itemElement) {
                            el.classList.remove('is-selected');
                            pedidoSelecionado.delete('Massa');
                        }
                    });
                    pedidoSelecionado.set(category, item);

                } else {
                    // Adiciona o primeiro item
                    pedidoSelecionado.set(category, [item]);
                }
            }

        } else {
            // Item DESSELECIONADO: Remove do Map
            if (category.includes('Tamanho Bolo')) {
                 pedidoSelecionado.delete('Tamanho do Bolo');

            } else {
                // Remove o item do array de itens daquela categoria
                let existingItems = pedidoSelecionado.get(category);
                if (Array.isArray(existingItems)) {
                    existingItems = existingItems.filter(i => i !== item);
                    if (existingItems.length === 0) {
                        pedidoSelecionado.delete(category);
                    } else {
                        pedidoSelecionado.set(category, existingItems);
                    }
                } else if (existingItems === item) {
                     pedidoSelecionado.delete(category);
                }
            }
        }

        // Atualiza a visualização do resumo
        updateResumo();
    }

    // Adiciona o listener de clique a todos os itens
    selectableItems.forEach(item => {
        item.addEventListener('click', handleItemClick);
    });

    // Inicializa o resumo ao carregar a página
    updateResumo();

    // Listener para o envio do Formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault(); 

        // 1. Coleta dos dados do formulário
        const nome = document.getElementById('nome').value;
        const telefone = document.getElementById('telefone').value;
        const data = document.getElementById('data').value; // CORREÇÃO de sintaxe
        const detalhes = document.getElementById('detalhes').value;

        // 2. Montagem da Mensagem do Pedido (com os itens selecionados)
        let itensDoPedido = '';
        pedidoSelecionado.forEach((items, category) => {
            // Verifica se é um array de itens ou um item único
            const itemString = Array.isArray(items) ? items.join(', ') : items;
            itensDoPedido += `*${category}:* ${itemString} `;
        });
        
        // Se a pessoa não selecionou nada, avisa
        if (itensDoPedido === '') {
            itensDoPedido = '*O cliente não selecionou itens das tabelas de valores, massas e recheios.*';
        }


        // 3. Formatação da mensagem final para WhatsApp
        const mensagem = 
            `*Olá, Delícias da Nyh! Gostaria de fazer uma encomenda.*\n
*DADOS DO CLIENTE:* 
*Nome:* ${nome}
*Telefone:* ${telefone} 
*Data Prevista:* ${data} \n
    
*DETALHES DO PEDIDO*
${itensDoPedido} 
${detalhes ? `*OBSERVAÇÕES ADICIONAIS:* ${detalhes}` : ''}\n
    *Aguardando a confirmação!*`;

        // 4. Criação e Redirecionamento
        const whatsappLink = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
        window.open(whatsappLink, '_blank');
    });
});