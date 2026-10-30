export class TipoSesion {
  constructor({ id, nombre, precioBase }) {
    this.id = id;
    this.nombre = nombre;
    this.precioBase = Number(precioBase);
  }

  static fromApi(data) {
    return new TipoSesion(data);
  }
}
