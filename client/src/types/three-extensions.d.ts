/**
 * Type declarations for THREE.js extensions
 */

declare module 'three/examples/jsm/geometries/TextGeometry' {
  import { BufferGeometry, Material, Mesh } from 'three';
  
  export interface TextGeometryParameters {
    font: Font;
    size?: number;
    height?: number;
    curveSegments?: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelOffset?: number;
    bevelSegments?: number;
  }
  
  export class TextGeometry extends BufferGeometry {
    constructor(text: string, parameters: TextGeometryParameters);
  }
  
  export class TextMesh extends Mesh {
    constructor(
      text: string,
      parameters: TextGeometryParameters,
      material?: Material | Material[]
    );
  }
}

declare module 'three/examples/jsm/loaders/FontLoader' {
  import { Loader, LoadingManager } from 'three';
  
  export class Font {
    constructor(jsondata: any);
    static isFont: boolean;
    data: string;
    generateShapes(text: string, size: number): any[];
  }
  
  export class FontLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad?: (font: Font) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(json: any): Font;
  }
}
