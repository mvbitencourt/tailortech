const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = 3000; // Porta que o servidor vai usar, pode ser modificada conforme necessário

// Configuração do EJS como view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware para servir arquivos estáticos e analisar dados do formulário
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'CHAVE-SECRETA-ALIMENTE-O-CAVALO-DA-DIREITA',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Configuração do banco de dados MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'senha',  // substitua pela sua senha do MySQL
    database: 'db_tailortech'
});

// Conectar ao banco de dados
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1);
    }
    console.log('Conectado ao banco de dados MySQL');
});

// Rota para a página inicial
app.get('/', (req, res) => {
    const query = 'SELECT * FROM Produtos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar produtos no banco de dados:', err);
            return res.status(500).send('Erro ao buscar produtos');
        }
        res.render('index', { produtos: results, user: req.session.user });
    });
});

// Rota para a página de login
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const query = 'SELECT * FROM Usuarios WHERE email = ? AND senha = ?';
    db.query(query, [email, senha], (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuário no banco de dados:', err);
            return res.status(500).send('Erro ao realizar login');
        }
        if (results.length > 0) {
            req.session.user = results[0];

            // Recuperar o carrinho do usuário
            const queryCarrinho = 'SELECT id FROM Carrinhos WHERE usuario_id = ?';
            db.query(queryCarrinho, [req.session.user.id], (err, results) => {
                if (err) {
                    console.error('Erro ao buscar carrinho no banco de dados:', err);
                    return res.status(500).send('Erro ao buscar carrinho');
                }
                if (results.length > 0) {
                    req.session.carrinhoId = results[0].id;
                }
                res.redirect('/');
            });
        } else {
            res.status(401).send('Email ou senha incorretos');
        }
    });
});

// Rota para fazer o logout, ela destroi o usuário salvo na sessão e redireciona para a página de login
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/register', (req, res) => {
    res.render('register'); // Adicionando a rota para a página de cadastro
});

// Rota para processar o formulário de cadastro
app.post('/register', (req, res) => {
    const { nome, email, senha, telefone, endereco } = req.body;

    // Inserir dados no banco de dados
    const queryUsuario = 'INSERT INTO Usuarios (nome, email, senha, celular, endereco) VALUES (?, ?, ?, ?, ?)';
    db.query(queryUsuario, [nome, email, senha, telefone, endereco], (err, results) => {
        if (err) {
            console.error('Erro ao inserir dados no banco de dados:', err);
            return res.status(500).send('Erro ao salvar dados');
        }
        const userId = results.insertId;

        // Criar carrinho para o novo usuário
        const queryCarrinho = 'INSERT INTO Carrinhos (usuario_id) VALUES (?)';
        db.query(queryCarrinho, [userId], (err, results) => {
            if (err) {
                console.error('Erro ao criar carrinho para o usuário:', err);
                return res.status(500).send('Erro ao criar carrinho');
            }
            res.redirect('/login');
        });
    });
});

// Rota para adicionar produtos ao carrinho
app.post('/addToCart', (req, res) => {
    const produtoId = req.body.id;
    const carrinhoId = req.session.carrinhoId;

    if (!carrinhoId) {
        return res.status(400).send({ success: false, message: 'Carrinho não encontrado' });
    }

    adicionarProdutoAoCarrinho(carrinhoId, produtoId, res);
});

function adicionarProdutoAoCarrinho(carrinhoId, produtoId, res) {
    // Buscar o preço do produto
    const queryPrecoProduto = 'SELECT preco FROM Produtos WHERE id = ?';
    db.query(queryPrecoProduto, [produtoId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar preço do produto no banco de dados:', err);
            return res.status(500).send({ success: false });
        }
        const produtoPreco = results[0].preco;

        // Verificar se o produto já está no carrinho
        const queryProduto = 'SELECT * FROM Produtos_Carrinho WHERE carrinho_id = ? AND produto_id = ?';
        db.query(queryProduto, [carrinhoId, produtoId], (err, results) => {
            if (err) {
                console.error('Erro ao buscar produto no carrinho no banco de dados:', err);
                return res.status(500).send({ success: false });
            }

            if (results.length > 0) {
                // Produto já está no carrinho, incrementar quantidade
                const queryAtualizarQuantidade = 'UPDATE Produtos_Carrinho SET quantidade = quantidade + 1 WHERE carrinho_id = ? AND produto_id = ?';
                db.query(queryAtualizarQuantidade, [carrinhoId, produtoId], (err, results) => {
                    if (err) {
                        console.error('Erro ao atualizar quantidade do produto no carrinho no banco de dados:', err);
                        return res.status(500).send({ success: false });
                    }
                    res.send({ success: true });
                });
            } else {
                // Adicionar novo produto ao carrinho
                const queryNovoProduto = 'INSERT INTO Produtos_Carrinho (carrinho_id, produto_id, quantidade, preco) VALUES (?, ?, 1, ?)';
                db.query(queryNovoProduto, [carrinhoId, produtoId, produtoPreco], (err, results) => {
                    if (err) {
                        console.error('Erro ao adicionar produto ao carrinho no banco de dados:', err);
                        return res.status(500).send({ success: false });
                    }
                    res.send({ success: true });
                });
            }
        });
    });
}

// Rota para a página de carrinho
app.get('/cart', (req, res) => {
    const userId = req.session.user.id;
    const queryCarrinho = `
        SELECT p.nome_produto, p.preco, pc.quantidade
        FROM Produtos p
        JOIN Produtos_Carrinho pc ON p.id = pc.produto_id
        JOIN Carrinhos c ON c.id = pc.carrinho_id
        WHERE c.usuario_id = ?;
    `;
    db.query(queryCarrinho, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar produtos do carrinho no banco de dados:', err);
            return res.status(500).send('Erro ao buscar produtos do carrinho');
        }
        res.render('cart', { produtosCarrinho: results, user: req.session.user });
    });
});

// Rota para processar o formulário de entrega e finalizar a compra
app.post('/checkout', (req, res) => {
    const { nome, email, contato, estado, cidade, endereco } = req.body;
    const carrinhoId = req.session.carrinhoId;

    // Verificar se o carrinhoId está disponível
    if (!carrinhoId) {
        return res.status(400).send('Carrinho não encontrado');
    }

    // Inserir dados do formulário de entrega
    const queryFormulario = 'INSERT INTO Formulario_Carrinho (carrinho_id, nome, contato, endereco_entrega) VALUES (?, ?, ?, ?)';
    db.query(queryFormulario, [carrinhoId, nome, contato, `${estado}, ${cidade}, ${endereco}`], (err, results) => {
        if (err) {
            console.error('Erro ao inserir dados do formulário de entrega no banco de dados:', err);
            return res.status(500).send('Erro ao finalizar compra');
        }
        const formularioId = results.insertId;

        // Calcular o preço total
        const queryPrecoTotal = 'SELECT SUM(preco * quantidade) AS preco_total FROM Produtos_Carrinho WHERE carrinho_id = ?';
        db.query(queryPrecoTotal, [carrinhoId], (err, results) => {
            if (err) {
                console.error('Erro ao calcular preço total:', err);
                return res.status(500).send('Erro ao finalizar compra');
            }
            const precoTotal = results[0].preco_total;

            // Inserir dados na tabela Compras_Confirmadas
            const queryComprasConfirmadas = 'INSERT INTO Compras_Confirmadas (carrinho_id, formulario_id, preco_total) VALUES (?, ?, ?)';
            db.query(queryComprasConfirmadas, [carrinhoId, formularioId, precoTotal], (err, results) => {
                if (err) {
                    console.error('Erro ao inserir dados na tabela Compras_Confirmadas:', err);
                    return res.status(500).send('Erro ao finalizar compra');
                }

                // Atualizar a coluna compra_id na tabela Formulario_Carrinho
                const compraId = results.insertId;
                const queryAtualizarFormulario = 'UPDATE Formulario_Carrinho SET compra_id = ? WHERE id = ?';
                db.query(queryAtualizarFormulario, [compraId, formularioId], (err, results) => {
                    if (err) {
                        console.error('Erro ao atualizar formulário de entrega com ID da compra:', err);
                        return res.status(500).send('Erro ao finalizar compra');
                    }

                    // Esvaziar a tabela Produtos_Carrinho para o carrinho do usuário
                    const queryEsvaziarCarrinho = 'DELETE FROM Produtos_Carrinho WHERE carrinho_id = ?';
                    db.query(queryEsvaziarCarrinho, [carrinhoId], (err, results) => {
                        if (err) {
                            console.error('Erro ao esvaziar o carrinho no banco de dados:', err);
                            return res.status(500).send('Erro ao finalizar compra');
                        }
                        res.send('Compra finalizada com sucesso');
                    });
                });
            });
        });
    });
});

// Rota padrão para lidar com outros caminhos
app.use((req, res) => {
    res.status(404).send('Página não encontrada');
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
