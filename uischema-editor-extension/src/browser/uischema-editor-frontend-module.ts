/**
 * Generated using theia-extension-generator
 */

import { ContainerModule } from "inversify";
import {
  CommandContribution,
  MenuContribution,
  ResourceProvider
} from "@theia/core/lib/common";
import { TreeEditorWidget, TreeEditorWidgetOptions } from 'theia-tree-editor/lib/browser';
import { WidgetFactory } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { UISchemaEditorCommandContribution } from './uischema-editor-contribution';
import { CoffeeApp, initStore } from './uischema-editor';

import '../../src/browser/style/index.css';

export default new ContainerModule(bind => {
  // pass constructor arguments to the constructor and resolve these arguments
  bind<WidgetFactory>(WidgetFactory).toDynamicValue(ctx => ({
    id: 'theia-tree-editor',
    async createWidget(uri: string): Promise<TreeEditorWidget> {
      const { container } = ctx;
      const resource = await container.get<ResourceProvider>(ResourceProvider)(new URI(uri));
      const store = await initStore();
      const child = container.createChild();
      child.bind<TreeEditorWidgetOptions>(TreeEditorWidgetOptions)
        .toConstantValue({ resource, store, EditorComponent: CoffeeApp, fileName: new URI(uri).path.base});
      return child.get(TreeEditorWidget);
    }
  }));

  /*[CommandContribution, MenuContribution].forEach(serviceIdentifier =>
    bind(serviceIdentifier).toService(UISchemaEditorCommandContribution)
  );*/
  bind(CommandContribution).to(UISchemaEditorCommandContribution);
  bind(MenuContribution).to(UISchemaEditorCommandContribution);
});
