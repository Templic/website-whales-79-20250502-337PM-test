/**
 * Extended Type Declarations for Three.js
 * 
 * This file extends the type declarations for the Three.js library to include
 * additional components and features that are not included in the base @types/three
 * package, such as TextGeometry and Font which are part of the examples.
 */

import * as THREE from 'three';

declare module 'three' {
  /**
   * TextGeometry is a geometry for rendering text with three.js
   * 
   * It creates a 3D text geometry by extruding the shapes of characters
   * from a specified font.
   */
  export class TextGeometry extends THREE.ExtrudeGeometry {
    constructor(
      text: string,
      parameters?: {
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
    );
  }

  /**
   * Font represents a typeface for use with TextGeometry
   */
  export class Font {
    constructor(jsondata$2;
    /**
     * Generates a set of shapes representing the text in this font
     */
    generateShapes(text: string, size?: number): THREE.Shape[];
    /**
     * The internal structure of the font
     */
    data: any;
  }
  
  // Add additional interfaces as needed
  
  /**
   * Extended material interfaces
   */
  interface TextGeometryParameters {
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
  
  /**
   * Extended loader interfaces
   */
  export class FontLoader extends THREE.Loader {
    constructor(manager?: THREE.LoadingManager);
    load(
      url: string,
      onLoad?: (font: Font) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (err$2 => void
    ): void;
    parse(json$2: Font;
  }
}

/**
 * Declare types for THREE.Extensions namespace that may contain community-developed extensions
 */
declare namespace THREE {
  export namespace Extensions {
    export interface GeometryUtils {
      center(geometry: THREE.BufferGeometry): THREE.BufferGeometry;
    }
  }
}

/**
 * Extend React Three Fiber type definitions
 */
declare module '@react-three/fiber' {
  export interface ThreeElements {
    textGeometry: any; // JSX.IntrinsicElements extension for textGeometry
    fontLoader: any;   // JSX.IntrinsicElements extension for fontLoader
  }
}