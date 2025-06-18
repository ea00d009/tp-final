const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf-8'));

app.post('/login', (req, res) => {
  const { usuario, contrasena } = req.body;
  const usuarioEncontrado = usuarios.find(
    (u) => u.usuario === usuario && u.contrasena === contrasena
  );

  if (usuarioEncontrado) {
    res.json({ success: true, message: 'Inicio de sesión exitoso' });
  } else {
    res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
  }
});

app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});
