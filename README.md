# JSFinance Backend

## Estrutura do Projeto

```
backend/
├── config/          # Configurações do banco de dados
├── controllers/     # Lógica de negócio
├── middleware/      # Middlewares customizados
├── models/          # Modelos do banco de dados
├── routes/          # Definição das rotas da API
├── utils/           # Funções utilitárias
├── tests/           # Testes automatizados
├── .env             # Variáveis de ambiente
├── server.js        # Arquivo principal do servidor
└── package.json     # Dependências e scripts
```

## Scripts Disponíveis

- `npm start` - Inicia o servidor em produção
- `npm run dev` - Inicia o servidor em desenvolvimento com nodemon
- `npm test` - Executa os testes

## API Endpoints

### Categorias
- `GET /api/categories` - Lista todas as categorias
- `POST /api/categories` - Cria nova categoria
- `PUT /api/categories/:id` - Atualiza categoria
- `DELETE /api/categories/:id` - Remove categoria

### Transações
- `GET /api/transactions` - Lista todas as transações
- `POST /api/transactions` - Cria nova transação
- `PUT /api/transactions/:id` - Atualiza transação
- `DELETE /api/transactions/:id` - Remove transação

### Relatórios
- `GET /api/reports/summary` - Resumo financeiro
- `GET /api/reports/charts` - Dados para gráficos
