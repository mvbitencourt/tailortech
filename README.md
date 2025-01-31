# TailorTech

TailorTech é uma plataforma de e-commerce projetada para customização e compra de itens sob medida. O sistema inclui registro de usuário, navegação de produtos, gerenciamento de carrinho de compras e processamento de pedidos.

## Índice

- [Esquema do Banco de Dados](#esquema-do-banco-de-dados)
- [Tabelas](#tabelas)
- [Diagrama de Caso de Uso](#diagrama-de-caso-de-uso)
- [Instruções de Configuração](#instruções-de-configuração)
- [Uso](#uso)
- [Pasta TAREFAS](#pasta-TAREFAS)
- [Autores](#autores)
- [Licença](#licença)

## Esquema do Banco de Dados

O esquema do banco de dados para TailorTech é ilustrado no diagrama a seguir:

![Esquema do Banco de Dados](./TAREFAS/Diagrama_ER.png)

### Tabelas

- **Usuários**: Armazena informações dos usuários, incluindo nome, email, senha e endereço.
- **Carrinhos**: Contém informações sobre os carrinhos de compras dos usuários.
- **Produtos**: Lista produtos disponíveis para compra.
- **Produtos_Carrinho**: Tabela de junção que conecta produtos e carrinhos de compras, com detalhes de quantidade e preço.
- **Formulario_Solicitacao_Item_Customizado**: Armazena formulários de solicitação de itens personalizados enviados pelos usuários.
- **Formulario_Carrinho**: Contém dados de formulários relacionados a pedidos do carrinho de compras.
- **Compras_Confirmadas**: Rastreia compras confirmadas.

## Diagrama de Caso de Uso

O diagrama de caso de uso abaixo representa as interações entre os usuários e o sistema, detalhando as várias funcionalidades fornecidas pelo TailorTech.

![Diagrama de Caso de Uso](./TAREFAS/Casos_de_uso.png)

## Instruções de Configuração

1. Clone o repositório:
    ```bash
    git clone https://github.com/mvbitencourt/tailortech.git
    ```
2. Navegue até o diretório do projeto:
    ```bash
    cd tailortech
    ```
3. Instale as dependências:
    ```bash
    npm install
    ```
4. Configure o banco de dados:
    - No menu superior, clique em "Server".
    - Selecione "Data Import".
    - Em "Import Options", selecione "Import from Self-Contained File".
    - Clique em "..." e navegue até o local onde o arquivo `db_tailortech.sql` está salvo e selecione-o.
    - Clique em "Start Import" para iniciar o processo de importação.
    - Aguarde até que o processo seja concluído.
    - No arquivo app.js, você encontrará a configuração de conexão com o banco de dados entre as linhas 25 e 30. É necessário mudar as credenciais de acordo com a configuração do mySQL local.

5. Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

## Uso

- **Registro de Usuário**: Os usuários podem se inscrever e fazer login em suas contas.
- **Navegação de Produtos**: Os usuários podem visualizar e pesquisar produtos.
- **Gerenciamento de Carrinho de Compras**: Os usuários podem adicionar, editar e remover produtos do carrinho de compras.
- **Processamento de Pedidos**: Os usuários podem preencher formulários de carrinho e confirmar suas compras.


## Pasta TAREFAS

A pasta `TAREFAS` contém arquivos importantes para o desenvolvimento e a documentação do projeto. Abaixo está uma descrição dos arquivos presentes nesta pasta:

- **Diagrama_ER.png**: Este arquivo apresenta o diagrama de entidade-relacionamento (ER) que ilustra a estrutura do banco de dados do projeto TailorTech.
- **Casos_de_uso.png**: Este arquivo apresenta o diagrama de casos de uso, mostrando as interações entre os usuários e o sistema.
- **modelo de front-end**: Este arquivo contém o modelo de front-end do projeto feito na plataforma Mobirise.
- **Plano de negócio**: Este arquivo contém o plano de negócios do nosso e-commerce feito de acordo com as normas do SEBRAE.
- **TailorTech_Canvas**: Este arquivo contém o Canvas do nosso e-commerce.
- **E-commerce de periféricos personalizáveis**: Este arquivo contém o projeto de fundação do nosso e-commerce.

## Autores

- Ana Cristina Pereira Morais
- Marcus Vinícius Bitencourt
