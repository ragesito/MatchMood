import {
  Component,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import loader from '@monaco-editor/loader';

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  template: `<div #editorContainer style="width:100%; height:100%;"></div>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
  `],
})
export class MonacoEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;

  @Input() language = 'javascript';
  @Input() theme = 'vs-dark';
  @Input() value = '';
  @Input() readOnly = false;

  @Output() valueChange = new EventEmitter<string>();

  private editor: any = null;
  private monacoInstance: any = null;

  async ngAfterViewInit(): Promise<void> {
    const monaco = await loader.init();
    this.monacoInstance = monaco;

    // Disable JS/TS validation — we show many languages and don't want false errors
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });

    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: this.value,
      language: this.language,
      theme: this.theme,
      readOnly: this.readOnly,
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      tabSize: 2,
    });

    // Emit code changes to the parent component
    this.editor.onDidChangeModelContent(() => {
      this.valueChange.emit(this.editor.getValue());
    });
  }

  // Update editor content programmatically (e.g. when opponent's code arrives via socket)
  setValue(code: string): void {
    if (this.editor) {
      this.editor.setValue(code);
    }
  }

  setLanguage(language: string): void {
    if (this.editor && this.monacoInstance) {
      this.monacoInstance.editor.setModelLanguage(this.editor.getModel(), language);
    }
  }

  getValue(): string {
    return this.editor?.getValue() ?? '';
  }

  ngOnDestroy(): void {
    this.editor?.dispose();
  }
}
