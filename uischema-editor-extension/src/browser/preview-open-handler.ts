import { FrontendApplication, OpenHandler, OpenerOptions } from '@theia/core/lib/browser';
import {
  MaybePromise,
  SelectionService,
  ResourceProvider
} from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { PreviewWidget } from './preview-widget';
import { inject, injectable } from "inversify";
import { WidgetManager } from '@theia/core/lib/browser';
import * as _ from 'lodash';
import { TreeEditorWidget } from 'theia-tree-editor/lib/browser';

@injectable()
export class UISchemaPreviewOpenHandler implements OpenHandler {
  readonly id = "uischema-preview-opener";
  constructor( @inject(WidgetManager) protected readonly widgetManager: WidgetManager,
               @inject(FrontendApplication) private app: FrontendApplication,
               @inject(SelectionService) readonly selectionService: SelectionService,
               @inject(ResourceProvider) private readonly resourceProvider: ResourceProvider) {
  }

  // Defines the editor's name in the open with menu
  get label() {
    return 'Open Preview';
  }

  canHandle(uri: URI, options?: OpenerOptions): MaybePromise<number> {
    if (uri.path.ext === '.json' &&
      _.head(this.widgetManager.getWidgets('theia-tree-editor')) !== undefined) {
      return 1000;
    }
    return 0;
  }

  /**
   * Open a widget for the given URI and options.
   * Resolve to an opened widget or undefined, e.g. if a page is opened.
   * Never reject if `canHandle` return a positive number; otherwise should reject.
   */
  open(uri: URI, options?: OpenerOptions): MaybePromise<object | undefined> {
    return this.resourceProvider(uri).then(resource => {
      return resource.readContents().then(content => {
        let parsedContent;
        try {
          parsedContent = JSON.parse(content);
        } catch (err) {
          console.warn('Invalid content', err);
          parsedContent = {};
        }
        const treeWidget = _.head(this.widgetManager.getWidgets('theia-tree-editor')) as TreeEditorWidget;
        if (treeWidget !== undefined) {
          const uischema = treeWidget.getRootData();
          const previewEditor = new PreviewWidget(parsedContent, uischema);
          previewEditor.title.caption = uri.path.base;
          previewEditor.title.label = uri.path.base;
          previewEditor.title.closable = true;
          this.app.shell.addWidget(previewEditor, {area: 'main'});
          this.app.shell.activateWidget(previewEditor.id);
          return previewEditor;
        } else {
          return undefined;
        }
      });
    });
  }
}
