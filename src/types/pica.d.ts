declare module 'pica' {
  export default class Pica {
    constructor(options?: any);
    resize(from: HTMLCanvasElement, to: HTMLCanvasElement, options?: any): Promise<HTMLCanvasElement>;
  }
}
