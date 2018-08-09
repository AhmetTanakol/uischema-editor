import { injectable, inject } from "inversify";
import {
  Command,
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
import { FileDownloadService } from '@theia/filesystem/lib/browser/download/file-download-service';
import * as _ from 'lodash';
import { OpenerOptions, WidgetManager, WidgetOpenHandler } from '@theia/core/lib/browser';
import { EditorContextMenu } from '@theia/editor/lib/browser';
import { TreeEditorWidget } from './theia-tree-editor-widget';


export const UISchemaDownloadCommand = {
  id: 'UISchemaDownload.command',
  label: "Download UI Schema"
};

export const ModelSchemaUploadCommand = {
  id: 'ModelSchemaUpload.command',
  label: "Upload Model Schema"
};

export namespace TreeEditorCommands {
  export const OPEN: Command = {
    id: 'TreeEditorOpen.command',
    label: 'Open With Tree Editor'
  };
}

export const NAVIGATOR_CONTEXT_MENU: MenuPath = ['navigator-context-menu'];

export namespace NavigatorContextMenu {
  export const DOWNLOAD = [...NAVIGATOR_CONTEXT_MENU, '5_download'];
  export const UPLOAD = [...NAVIGATOR_CONTEXT_MENU, '6_upload'];
}

@injectable()
export class UISchemaEditorContribution extends WidgetOpenHandler<TreeEditorWidget> implements CommandContribution, MenuContribution {
  readonly id = 'theia-tree-editor';
  readonly label = 'Open With Tree Editor';

  constructor(
    @inject(WidgetManager) protected readonly widgetManager: WidgetManager,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(SelectionService) private readonly selectionService: SelectionService,
    @inject(FileDownloadService) private readonly fileDownloadService: FileDownloadService,
    @inject(ResourceProvider) private readonly resourceProvider: ResourceProvider,
  ) {
    super();
  }

  canHandle(uri: URI): number {
    if (uri.path.ext === '.json') {
      return 1000;
    }
    return 0;
  }

  async open(uri: URI, options?: OpenerOptions): Promise<TreeEditorWidget> {
    return super.open(uri);
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(EditorContextMenu.NAVIGATION, {
      commandId: TreeEditorCommands.OPEN.id,
      label: TreeEditorCommands.OPEN.label,
    });
    menus.registerMenuAction(NavigatorContextMenu.DOWNLOAD, {
      commandId: UISchemaDownloadCommand.id,
      label: UISchemaDownloadCommand.label
    });
    menus.registerMenuAction(NavigatorContextMenu.UPLOAD, {
      commandId: ModelSchemaUploadCommand.id,
      label: ModelSchemaUploadCommand.label
    });
  }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(TreeEditorCommands.OPEN, new UriAwareCommandHandler<URI>(this.selectionService,
    {
      execute: uri => this.openForEditor(uri),
      isEnabled: uri => uri.scheme === 'file' && uri.path.ext === '.json',
      isVisible: uri => uri.scheme === 'file' && uri.path.ext === '.json',
    }));

    registry.registerCommand(UISchemaDownloadCommand, this.newUriAwareCommandHandler({
      execute: uris => {
        this.executeDownload(uris);
        this.messageService.info('Download completed');
      },
      isEnabled: uris => uris.length > 0 && uris.every(u => u.scheme === 'file' && u.path.ext === '.json'),
      isVisible: uris => uris.every(u => u.scheme === 'file' && u.path.ext === '.json')
    }));

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

  protected async executeDownload(uris: URI[]): Promise<void> {
    this.fileDownloadService.download(uris);
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

  protected newUriAwareCommandHandler(handler: UriCommandHandler<URI[]>): UriAwareCommandHandler<URI[]> {
    return new UriAwareCommandHandler<URI[]>(this.selectionService, handler, { multi: true });
  }

  protected async openForEditor(uri): Promise<void> {
    if (!uri) {
      return;
    }
    await this.open(uri);
  }

  protected retrieveWidget(id: string): TreeEditorWidget {
    return _.head(this.widgetManager.getWidgets(id)) as TreeEditorWidget;
  }
}
