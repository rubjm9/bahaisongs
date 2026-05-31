/**
 * Type declarations for third-party Lit web components used in the app.
 */

declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'chordpro-editor': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          content?: string;
          theme?: string;
          'font-size'?: number;
          'line-numbers'?: boolean;
          minimap?: boolean;
          'word-wrap'?: boolean;
          'read-only'?: boolean;
          'tab-size'?: number;
        },
        HTMLElement
      >;
      'chordpro-renderer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          content?: string;
          instrument?: string;
          'show-chords'?: boolean;
          'chord-position'?: 'top' | 'right' | 'bottom';
          format?: 'html' | 'text';
        },
        HTMLElement
      >;
    }
  }
}
