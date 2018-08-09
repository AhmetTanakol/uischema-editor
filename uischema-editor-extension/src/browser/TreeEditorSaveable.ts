import { Saveable } from '@theia/core/lib/browser';
import { Disposable, Event, MaybePromise, Resource } from '@theia/core/lib/common';
import { getData, getSchema } from '@jsonforms/core';
import * as AJV from 'ajv';

const ajv = new AJV({allErrors: true, verbose: true});


export class TreeEditorSaveable implements Saveable {
  autoSave;
  dirty: boolean = false;
  onDirtyChanged: Event<void> = Object.assign((listener: (e) => any) => {
      let result: Disposable;
      result = {
        dispose: () => {}
      };

      return result;
    }, {
      maxListeners: 30
    }
  );

  constructor(private resource: Resource, private store: any) {}

  save(): MaybePromise<void> {
    const validator = ajv.compile(getSchema(this.store.getState()));
    const valid = validator(getData(this.store.getState()));
    if (valid) {
      this.saveData(this.resource, getData(this.store.getState()));
      this.dirty = false;
    } else {
      console.warn('cannot save, invalid data object');
    }
  }

  // Saves the data into resource's content.
  private saveData = (resource: Resource, data: Object): void => {
    if ( resource.saveContents !== undefined ) {
      resource.saveContents(JSON.stringify(data, null, 2), { encoding: 'UTF-8' });
    } else {
      console.warn('resource cannot save');
    }
  }
};
