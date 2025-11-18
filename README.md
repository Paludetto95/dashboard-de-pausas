# Dashboard de Pausas

Um dashboard interativo para análise de pausas de consultores, desenvolvido com HTML, JavaScript e integração com a API Argus.

## Funcionalidades

- Visualização de dados de pausas em tempo real
- Filtros por consultor e tipo de pausa
- Gráficos interativos de distribuição de pausas
- Análise detalhada por período
- Integração com API Argus para dados em tempo real

## Tecnologias Utilizadas

- HTML5
- JavaScript
- Chart.js para visualizações
- Tailwind CSS para estilização
- Node.js para o backend
- Express.js para o servidor proxy

## Configuração

1. Clone o repositório:
```bash
git clone git@github.com:Paludetto95/dashboard-de-pausas.git
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Crie um arquivo `.env` na raiz do projeto
- Defina URL e tokens do Argus (sem expor no código):
```env
# URL base da API Argus
ARGUS_API_URL=https://argus.app.br/apiargus

# Token geral (acesso a todas as campanhas)
ARGUS_API_TOKEN_GLOBAL=coloque_o_token_geral_aqui

# Opcional: tokens específicos por campanha (JSON com IDs)
# Exemplo: {"1":"token_da_campanha_1","2":"token_da_campanha_2"}
ARGUS_CAMPAIGN_TOKENS={"1":"token_cam_1","2":"token_cam_2"}

# Chave de API da IA (se usar a análise)
GEMINI_API_KEY=sua_chave_aqui
```

- Se você informar `idCampanha` na requisição, o proxy usará `ARGUS_CAMPAIGN_TOKENS[idCampanha]`.
- Caso contrário, usará `ARGUS_API_TOKEN_GLOBAL`.

4. Inicie o servidor:
```bash
npm start
```

## Estrutura do Projeto

```
├── api/
│   └── dados-argus.mjs   # Endpoint proxy Argus (usa variáveis de ambiente)
├── dash.html             # Interface principal
├── server.js            # Servidor proxy
└── vercel.json          # Configuração do Vercel
```

## Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.