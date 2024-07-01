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
            res.redirect('/');
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
    const query = 'INSERT INTO Usuarios (nome, email, senha, celular, endereco) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [nome, email, senha, telefone, endereco], (err, results) => {
        if (err) {
            console.error('Erro ao inserir dados no banco de dados:', err);
            return res.status(500).send('Erro ao salvar dados');
        }
        res.redirect('/login');
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
