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
    secret: 'NOVA-CHAVE-SECRETA-ALEATORIA',
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
    res.render('login', { message: null });
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
            res.redirect('/');
        } else {
            res.render('login', { message: 'Email ou senha incorretos' });
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
    const query = 'INSERT INTO Usuarios (nome, email, senha, celular, endereco) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [nome, email, senha, telefone, endereco], (err, results) => {
        if (err) {
            console.error('Erro ao inserir dados no banco de dados:', err);
            return res.status(500).send('Erro ao salvar dados');
        }
        res.redirect('/login');
    });
});

// Rota para adicionar produtos ao carrinho
app.post('/addToCart', (req, res) => {
    const produtoId = req.body.id;
    const userId = req.session.user.id;

    // Buscar o preço do produto
    const queryProduto = 'SELECT preco FROM Produtos WHERE id = ?';
    db.query(queryProduto, [produtoId], (err, produtoResults) => {
        if (err) {
            console.error('Erro ao buscar produto no banco de dados:', err);
            return res.status(500).send({ success: false });
        }

        const precoProduto = produtoResults[0].preco;

        // Verificar se o carrinho já existe para o usuário
        const queryCarrinho = 'SELECT id FROM Carrinhos WHERE usuario_id = ?';
        db.query(queryCarrinho, [userId], (err, results) => {
            if (err) {
                console.error('Erro ao buscar carrinho no banco de dados:', err);
                return res.status(500).send({ success: false });
            }

            let carrinhoId;

            if (results.length > 0) {
                // Carrinho já existe
                carrinhoId = results[0].id;
                adicionarProdutoAoCarrinho(carrinhoId, produtoId, precoProduto, res);
            } else {
                // Criar novo carrinho
                const queryNovoCarrinho = 'INSERT INTO Carrinhos (usuario_id) VALUES (?)';
                db.query(queryNovoCarrinho, [userId], (err, results) => {
                    if (err) {
                        console.error('Erro ao criar novo carrinho no banco de dados:', err);
                        return res.status(500).send({ success: false });
                    }
                    carrinhoId = results.insertId;
                    adicionarProdutoAoCarrinho(carrinhoId, produtoId, precoProduto, res);
                });
            }
        });
    });
});

function adicionarProdutoAoCarrinho(carrinhoId, produtoId, precoProduto, res) {
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
            db.query(queryNovoProduto, [carrinhoId, produtoId, precoProduto], (err, results) => {
                if (err) {
                    console.error('Erro ao adicionar produto ao carrinho no banco de dados:', err);
                    return res.status(500).send({ success: false });
                }
                res.send({ success: true });
            });
        }
    });
}

// Rota para a página de carrinho
app.get('/cart', (req, res) => {
    const userId = req.session.user.id;
    const queryCarrinho = `
        SELECT p.id, p.nome_produto, p.preco, pc.quantidade
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

        // Calcular o total
        let total = 0;
        results.forEach(produto => {
            total += produto.preco * produto.quantidade;
        });

        res.render('cart', { produtosCarrinho: results, total, user: req.session.user });
    });
});

// Rota para processar o formulário de customização
app.post('/customization', (req, res) => {
    const { nome, email, descricao } = req.body;
    const userId = req.session.user.id;

    // Inserir dados no banco de dados
    const query = 'INSERT INTO formulario_solicitacao_item_customizado (usuario_id, nome, email, descricao_item) VALUES (?, ?, ?, ?)';
    db.query(query, [userId, nome, email, descricao], (err, results) => {
        if (err) {
            console.error('Erro ao inserir dados no banco de dados:', err);
            return res.status(500).send('Erro ao salvar dados');
        }
        res.send('<script>alert("Formulário enviado com sucesso!"); window.location.href = "/";</script>');
    });
});


// Rota para finalizar a compra
app.post('/checkout', (req, res) => {
    const { nome, email, contato, estado, cidade, endereco } = req.body;
    const userId = req.session.user.id;

    // Buscar o carrinho do usuário
    const queryCarrinho = 'SELECT id FROM Carrinhos WHERE usuario_id = ?';
    db.query(queryCarrinho, [userId], (err, carrinhoResults) => {
        if (err) {
            console.error('Erro ao buscar carrinho no banco de dados:', err);
            return res.status(500).send('Erro ao finalizar compra');
        }

        const carrinhoId = carrinhoResults[0].id;

        // Calcular o preço total do carrinho
        const queryPrecoTotal = 'SELECT SUM(preco * quantidade) AS preco_total FROM Produtos_Carrinho WHERE carrinho_id = ?';
        db.query(queryPrecoTotal, [carrinhoId], (err, precoTotalResults) => {
            if (err) {
                console.error('Erro ao calcular preço total:', err);
                return res.status(500).send('Erro ao finalizar compra');
            }

            const precoTotal = precoTotalResults[0].preco_total;

            // Inserir dados do formulário no banco de dados
            const queryFormulario = 'INSERT INTO Formulario_Carrinho (carrinho_id, nome, contato, endereco_entrega) VALUES (?, ?, ?, ?)';
            db.query(queryFormulario, [carrinhoId, nome, contato, endereco], (err, formularioResults) => {
                if (err) {
                    console.error('Erro ao inserir dados do formulário de entrega no banco de dados:', err);
                    return res.status(500).send('Erro ao finalizar compra');
                }

                const formularioId = formularioResults.insertId;

                // Inserir dados da compra confirmada no banco de dados
                const queryCompra = 'INSERT INTO Compras_Confirmadas (carrinho_id, formulario_id, preco_total) VALUES (?, ?, ?)';
                db.query(queryCompra, [carrinhoId, formularioId, precoTotal], (err, compraResults) => {
                    if (err) {
                        console.error('Erro ao inserir dados da compra confirmada no banco de dados:', err);
                        return res.status(500).send('Erro ao finalizar compra');
                    }

                    const compraId = compraResults.insertId;

                    // Atualizar o ID da compra no formulário de entrega
                    const queryAtualizarFormulario = 'UPDATE Formulario_Carrinho SET compra_id = ? WHERE id = ?';
                    db.query(queryAtualizarFormulario, [compraId, formularioId], (err) => {
                        if (err) {
                            console.error('Erro ao atualizar o formulário de entrega no banco de dados:', err);
                            return res.status(500).send('Erro ao finalizar compra');
                        }

                        // Esvaziar o carrinho
                        const queryEsvaziarCarrinho = 'DELETE FROM Produtos_Carrinho WHERE carrinho_id = ?';
                        db.query(queryEsvaziarCarrinho, [carrinhoId], (err) => {
                            if (err) {
                                console.error('Erro ao esvaziar o carrinho no banco de dados:', err);
                                return res.status(500).send('Erro ao finalizar compra');
                            }

                            // Redirecionar para a página de confirmação de compra
                            res.send('<script>alert("Compra finalizada com sucesso!"); window.location.href = "/";</script>');
                        });
                    });
                });
            });
        });
    });
});

// Rota para atualizar a quantidade de um produto no carrinho
app.post('/updateQuantity', (req, res) => {
    const { id, action } = req.body;
    const userId = req.session.user.id;

    // Buscar o carrinho do usuário
    const queryCarrinho = 'SELECT id FROM Carrinhos WHERE usuario_id = ?';
    db.query(queryCarrinho, [userId], (err, carrinhoResults) => {
        if (err) {
            console.error('Erro ao buscar carrinho no banco de dados:', err);
            return res.status(500).send({ success: false });
        }

        const carrinhoId = carrinhoResults[0].id;

        // Atualizar a quantidade do produto
        let queryAtualizarQuantidade;
        if (action === 'increase') {
            queryAtualizarQuantidade = 'UPDATE Produtos_Carrinho SET quantidade = quantidade + 1 WHERE carrinho_id = ? AND produto_id = ?';
        } else if (action === 'decrease') {
            queryAtualizarQuantidade = 'UPDATE Produtos_Carrinho SET quantidade = quantidade - 1 WHERE carrinho_id = ? AND produto_id = ? AND quantidade > 1';
        }

        db.query(queryAtualizarQuantidade, [carrinhoId, id], (err, results) => {
            if (err) {
                console.error('Erro ao atualizar quantidade do produto no carrinho no banco de dados:', err);
                return res.status(500).send({ success: false });
            }
            res.send({ success: true });
        });
    });
});

// Rota para deletar um produto do carrinho
app.post('/deleteProduct', (req, res) => {
    const { id } = req.body;
    const userId = req.session.user.id;

    // Buscar o carrinho do usuário
    const queryCarrinho = 'SELECT id FROM Carrinhos WHERE usuario_id = ?';
    db.query(queryCarrinho, [userId], (err, carrinhoResults) => {
        if (err) {
            console.error('Erro ao buscar carrinho no banco de dados:', err);
            return res.status(500).send({ success: false });
        }

        const carrinhoId = carrinhoResults[0].id;

        // Deletar o produto do carrinho
        const queryDeletarProduto = 'DELETE FROM Produtos_Carrinho WHERE carrinho_id = ? AND produto_id = ?';
        db.query(queryDeletarProduto, [carrinhoId, id], (err, results) => {
            if (err) {
                console.error('Erro ao deletar produto do carrinho no banco de dados:', err);
                return res.status(500).send({ success: false });
            }
            res.send({ success: true });
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
