import { BaseWidget } from '@theia/core/lib/browser';
import { Message, Saveable, SaveableSource } from '@theia/core/lib/browser';
import { Resource } from '@theia/core/lib/common';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { TreeEditorSaveable } from './TreeEditorSaveable';
import { inject, injectable } from 'inversify';
import { Actions } from '@jsonforms/core';
import { withProps } from 'recompose';

export const TreeEditorWidgetOptions = Symbol('TreeEditorWidgetOptions');
export interface TreeEditorWidgetOptions {
  resource: Resource;
  store: any;
  EditorComponent: React.Component;
  fileName: string;
}

let widgetCounter = 0;
@injectable()
export class TreeEditorWidget extends BaseWidget implements SaveableSource {
  saveable: Saveable;
  protected resource: Resource;
  protected store: any;
  constructor(
    @inject(TreeEditorWidgetOptions) protected readonly options: TreeEditorWidgetOptions,
  ) {
    super();
    widgetCounter++;
    this.id = `react-app-${widgetCounter}`;
    this.resource = this.options.resource;
    this.store = this.options.store;
    this.addClass('tree-class');
    this.saveable = new TreeEditorSaveable(this.resource, this.store);
    this.title.closable = true;
    this.title.label = this.options.fileName;
    this.title.caption = this.title.label;
    this.resource.readContents().then(content => {
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch (err) {
        console.warn('Invalid content', err);
        parsedContent = {};
      }
      Promise.resolve(this.store).then(initializedStore => {
        initializedStore.dispatch(Actions.update('', () => parsedContent));
        const Editor = withProps({'saveable': this.saveable})(this.options.EditorComponent);
        ReactDOM.render(
          <Provider store={initializedStore}>
            <Editor/>
          </Provider>,
          this.node);
      });
    });
  }

  onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    if (this.node.children.length > 0) {
      (this.node.children.item(0) as HTMLElement).focus();
    } else {
      this.node.focus();
    }
    this.update();
  }

  onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
  }

  close() {
    super.close();
  }

  uploadModelSchema(modelSchema: Object): void {
    this.store.dispatch({
      type: 'jsonforms/uiEditor/SET_MODEL_SCHEMA',
      modelSchema: modelSchema
    });
  }
}
