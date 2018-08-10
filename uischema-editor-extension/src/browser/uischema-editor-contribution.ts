import { injectable, inject } from "inversify";
import {
  CommandContribution,
  CommandRegistry,
  MenuContribution,
  MenuModelRegistry,
  MenuPath,
  MessageService,
  ResourceProvider,
  SelectionService
} from "@theia/core/lib/common";
import { UriCommandHandler, UriAwareCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import URI from '@theia/core/lib/common/uri';
import { TreeEditorWidget } from 'theia-tree-editor/lib/browser';
import { WidgetManager } from '@theia/core/lib/browser';
import * as _ from 'lodash';

export const ModelSchemaUploadCommand = {
  id: 'ModelSchemaUpload.command',
  label: "Upload Model Schema"
};

export const NAVIGATOR_CONTEXT_MENU: MenuPath = ['navigator-context-menu'];

export namespace NavigatorContextMenu {
  export const UPLOAD = [...NAVIGATOR_CONTEXT_MENU, '6_upload'];
}

@injectable()
export class UISchemaEditorCommandContribution implements CommandContribution, MenuContribution {

  constructor(
    @inject(WidgetManager) protected readonly widgetManager: WidgetManager,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(SelectionService) private readonly selectionService: SelectionService,
    @inject(ResourceProvider) private readonly resourceProvider: ResourceProvider
  ) { }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(NavigatorContextMenu.UPLOAD, {
      commandId: ModelSchemaUploadCommand.id,
      label: ModelSchemaUploadCommand.label
    });
  }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(ModelSchemaUploadCommand, this.newUriAwareCommandHandler({
      execute: uris => {
        this.resourceProvider(_.head(uris)).then(resource => {
          resource.readContents().then(content => {
            let parsedContent;
            try {
              parsedContent = JSON.parse(content);
            } catch (err) {
              console.warn('Invalid content', err);
              parsedContent = {};
            }
            this.executeModelSchemaUpload(parsedContent);
          });
        });
      },
      isEnabled: uris => uris.length > 0 &&
        uris.every(u => u.scheme === 'file' && u.path.ext === '.json') &&
        this.retrieveWidget('theia-tree-editor') !== undefined,
      isVisible: uris => uris.every(u => u.scheme === 'file' && u.path.ext === '.json')
    }));
  }

  protected newUriAwareCommandHandler(handler: UriCommandHandler<URI[]>): UriAwareCommandHandler<URI[]> {
    return new UriAwareCommandHandler<URI[]>(this.selectionService, handler, { multi: true });
  }

  protected async executeModelSchemaUpload(modelSchema: Object): Promise<void> {
    const widget = this.retrieveWidget('theia-tree-editor');
    if (widget !== undefined) {
      widget.uploadModelSchema(modelSchema);
      this.messageService.info('Model Schema Upload completed');
    } else {
      this.messageService.error('Editor Not Found');
    }
  }

  protected retrieveWidget(id: string): TreeEditorWidget {
    return _.head(this.widgetManager.getWidgets(id)) as TreeEditorWidget;
  }
}
