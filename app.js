// Importações e configurações
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

// Rotas
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/cart', (req, res) => {
    res.render('cart');
});

// Rota para lidar com o formulário de contato (exemplo)
app.post('/contact', (req, res) => {
    // Lógica para lidar com o formulário de contato
    res.send('Formulário de contato recebido!');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Implementar lógica aqui para verificar se usuário existe e se senha é correta
    // Se o usuário for correto, pegue o id e nome dele do banco de dados
    // Salvar o usuário logado na sessão para poder pegar essas informações em outras páginas
    const user = {id: 1, nome: 'Ana'};
    req.session.user = user;

    // redireciona para a página inicial após efetuar o login ou para a página de login caso
    // email e/ou senha estejam errados
    if (!user) {
        res.render('index')
    } else {
        res.redirect('/')
    }
});

// Rota para fazer o logout, ela destroi o usuário salvo na sessão e redireciona para a página inicial
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/register', (req, res) => {
    res.render('register'); // Adicionando a rota para a página de cadastro
});

// Rota para processar o formulário de cadastro
app.post('/register', (req, res) => {
    const { nome, email, senha, telefone, endereco } = req.body;

    // Log para ver os dados recebidos
    console.log('Dados recebidos do formulário:', req.body);

    // Inserir dados no banco de dados
    const query = 'INSERT INTO Usuarios (nome, endereco, email, celular, senha) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [nome, email, senha, telefone, endereco], (err, results) => {
        if (err) {
            console.error('Erro ao inserir dados no banco de dados:', err);
            return res.status(500).send('Erro ao salvar dados');
        }
        console.log('Dados inseridos com sucesso:', results);
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
