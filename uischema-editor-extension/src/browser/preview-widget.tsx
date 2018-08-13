import { Widget } from "@phosphor/widgets";
import { Message } from '@theia/core/lib/browser';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import {
  JsonSchema,
  UISchemaElement,
  Actions,
  jsonformsReducer,
  RankedTester
} from '@jsonforms/core';
import { materialFields, materialRenderers } from '@jsonforms/material-renderers';
import { combineReducers, createStore } from 'redux';
import { Preview } from './Preview';

let num = 0;
export class PreviewWidget extends Widget {
  constructor(private schema: JsonSchema, private uischema: UISchemaElement) {
    super();
    num++;
    this.id = `preview-${num}`;
    this.addClass('tree-class');
    const renderers: { tester: RankedTester, renderer: any}[] = materialRenderers;
    const fields: { tester: RankedTester, field: any}[] = materialFields;
    const store = createStore(
      combineReducers({ jsonforms: jsonformsReducer() }),
      {
        jsonforms: {
          renderers,
          fields,
        }
      }
    );
    store.dispatch(Actions.init({}, this.schema, this.uischema));
    ReactDOM.render(
      <Provider store={store}>
        <Preview/>
      </Provider>,
      this.node);
  }

  onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.focus();
    this.update();
  }

  onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
  }

  close() {
    super.close();
  }
}
