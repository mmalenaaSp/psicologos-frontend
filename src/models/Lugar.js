export class Lugar {
  constructor({ id, nombre, direccion }) {
    this.id = id;
    this.nombre = nombre;
    this.direccion = direccion;
  }

  static fromApi(data) {
    return new Lugar(data);
  }
}
