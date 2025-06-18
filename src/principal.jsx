// Importamos React, la biblioteca fundamental para construir interfaces de usuario.
import React from 'react';

// Importamos ReactDOM desde 'react-dom/client'. 
// ReactDOM provee métodos específicos del DOM que pueden ser usados en el nivel más alto de tu aplicación.
// 'react-dom/client' es la API para el nuevo modo raíz concurrente de React 18.
import ReactDOM from 'react-dom/client';

// Importamos el componente principal de nuestra aplicación, 'Aplicacion', desde './Aplicacion.jsx'.
// Importa el componente principal de la aplicación (Clima)
import Aplicacion from './Aplicacion';

// Importamos 'estilosGlobales.css'. Este archivo usualmente contiene estilos globales
// que se aplican a toda la aplicación, como resets de CSS, estilos para el body, etc.
import './estilosGlobales.css';

// Obtenemos el elemento del DOM con el id 'root'.
// Este es el contenedor en tu archivo HTML (generalmente public/index.html)
// donde se montará toda la aplicación React.
const rootElement = document.getElementById('root');

// Creamos un "raíz" de React para el elemento contenedor obtenido.
// ReactDOM.createRoot() es la nueva forma de iniciar una aplicación React en React 18.
const root = ReactDOM.createRoot(rootElement);

// Usamos el método render de la raíz para renderizar nuestro componente Aplicacion.
// Esto le dice a React que maneje el contenido del 'rootElement' en el DOM.
root.render(
  <Aplicacion />
);
