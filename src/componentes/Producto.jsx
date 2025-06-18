// Importamos React, necesario para crear componentes.
import React from 'react';

// Importamos el archivo CSS para los estilos específicos de este componente.
import './Producto.css';

// Definimos el componente funcional 'Producto'.
// Este componente espera recibir un objeto 'producto' como prop.
// Usamos la desestructuración de props directamente en los parámetros: ({ producto }).
const Producto = ({ producto }) => {
  // El componente devuelve la estructura JSX que representa una tarjeta de producto.
  return (
    // 'div' principal con la clase 'producto-tarjeta' para aplicar estilos a la tarjeta.
    <div className="producto-tarjeta">
      {/* Contenedor para la imagen del producto. */}
      <div className="producto-imagen-contenedor">
        <img
          className="producto-imagen" // Clase para estilizar la imagen.
          // src: La fuente de la imagen.
          // Intentamos acceder a la URL de la primera imagen en el array 'producto.imagenes'.
          // 'producto.imagenes[0]?.url': El operador de encadenamiento opcional (?.)
          //   previene un error si 'producto.imagenes[0]' es undefined o null.
          //   Si es undefined/null, toda la expresión 'producto.imagenes[0]?.url' devuelve undefined.
          // '?? './sinimagen.jpg'': El operador de coalescencia nula (??)
          //   proporciona un valor de respaldo. Si la expresión a la izquierda (producto.imagenes[0]?.url)
          //   es null o undefined, se usará './sinimagen.jpg' como URL de la imagen.
          src={producto.imagenes[0]?.url ?? './sinimagen.jpg'}
          // alt: Texto alternativo para la imagen, importante para accesibilidad y SEO.
          // Usamos el nombre del producto como texto alternativo.
          alt={producto.nombre}
        />
      </div>

      {/* Un separador horizontal para dividir visualmente la imagen de la información. */}
      <hr className="producto-divisor" />

      {/* Contenedor para la información del producto (nombre y descripción). */}
      <div className="producto-informacion">
        {/* Nombre del producto, renderizado como un encabezado h3. */}
        <h3 className="producto-nombre">{producto.nombre}</h3>
        {/* Descripción del producto, renderizada como un párrafo. */}
        <p className="producto-descripcion">{producto.descripcion}</p>
      </div>

      {/* Pie de la tarjeta del producto, para precio y SKU. */}
      <div className="producto-pie">
        {/* Precio del producto. 
            Usamos `toFixed(2)` para formatear el precio a dos decimales.
            El símbolo '$' se añade como texto. */}
        <span className="producto-precio">${producto.precio.toFixed(2)}</span>
        {/* SKU (Stock Keeping Unit) del producto. */}
        <span className="producto-sku">SKU: {producto.sku}</span>
      </div>
    </div>
  );
};

// Exportamos el componente Producto para que pueda ser importado y utilizado en otros lugares de la aplicación.
export default Producto;
