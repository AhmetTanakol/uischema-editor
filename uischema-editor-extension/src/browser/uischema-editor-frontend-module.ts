/**
 * Generated using theia-extension-generator
 */

import { ContainerModule } from "inversify";
import {
  TreeEditorOpenHandler
} from 'theia-tree-editor-extension/lib/browser/theia-tree-editor-open-handler';
import { OpenHandler } from "@theia/core/lib/browser";
import { UiSchemaEditor } from './uischema-editor';

import '../../src/browser/style/index.css';

export default new ContainerModule(bind => {

  bind(TreeEditorOpenHandler).to(UiSchemaEditor);
  bind(OpenHandler).to(UiSchemaEditor);
});
