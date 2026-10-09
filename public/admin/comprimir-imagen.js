/**
 * Prepara una imagen del admin antes de subirla.
 *
 * Las fotos de cámara pesan 8–20 MB y el servidor acepta hasta 10 MB: el
 * admin las descartaba y solo decía "Error al subir las imágenes", sin
 * motivo (reportado por el cliente, oct 2026). Aquí se redimensionan a
 * 2000 px por lado y se recomprimen en el navegador, que sobra para una
 * ficha de producto; y si algo no se puede subir, se dice por qué.
 *
 * Expone window.prepararImagenParaSubir(file) → Promise<File>.
 * Se carga con <script is:inline src="/admin/comprimir-imagen.js">.
 */
(function () {
  var MAX_LADO = 2000;
  var SIN_TOCAR = 2 * 1024 * 1024;   // hasta 2 MB se sube tal cual
  var MAXIMO = 10 * 1024 * 1024;     // límite del servidor

  function mb(n) { return (n / 1048576).toFixed(1) + ' MB'; }

  function cargar(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('No se pudo leer "' + file.name + '" como imagen.')); };
      img.src = url;
    });
  }

  window.prepararImagenParaSubir = async function (file) {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) {
      throw new Error('"' + (file && file.name ? file.name : 'archivo') + '" no es una imagen (PNG, JPG o GIF).');
    }
    if (file.type === 'image/gif' || file.size <= SIN_TOCAR) {
      if (file.size > MAXIMO) throw new Error('"' + file.name + '" pesa ' + mb(file.size) + '; el máximo es 10 MB.');
      return file;
    }

    var img = await cargar(file);
    var escala = Math.min(1, MAX_LADO / Math.max(img.naturalWidth, img.naturalHeight));
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

    var esPng = file.type === 'image/png';
    var blob = await new Promise(function (resolve) {
      canvas.toBlob(resolve, esPng ? 'image/png' : 'image/jpeg', 0.85);
    });

    var resultado = file;
    if (blob && blob.size < file.size) {
      var nombre = file.name.replace(/\.[^.]+$/, '') + (esPng ? '.png' : '.jpg');
      resultado = new File([blob], nombre, { type: blob.type });
    }
    if (resultado.size > MAXIMO) {
      throw new Error('"' + file.name + '" pesa ' + mb(resultado.size) + ' incluso comprimida; el máximo es 10 MB.');
    }
    return resultado;
  };
})();
