const express = require('express');
const path = require('path');
const app = express();
const session = require('express-session');
const port = 3000; // Porta que o servidor vai usar, pode ser modificada conforme necessário

// Configuração do EJS como view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'CHAVE-SECRETA-ALIMENTE-O-CAVALO-DA-DIREITA',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

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
    // Salvar o usuário logado na seção para poder pegar essas informações em outras páginas
    const user = {id: 1, nome: 'Ana'};
    req.session.user = user;

    // redireciona para á paginal inicial após efetuar o login ou para a página de login caso
    // email e/ou senha estejam errados
    if (!user) {
        res.render('index')
    } else {
        res.redirect('/')
    }
});

// Rota para fazer o logout, ela destroi o usuário salvo na seção e redireciona para a página inicial
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Rota padrão para lidar com outros caminhos
app.use((req, res) => {
    res.status(404).send('Página não encontrada');
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
