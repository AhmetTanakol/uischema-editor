import { JsonForms } from '@jsonforms/react';
import * as React from 'react';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';


const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#FFFFFF'
    },
    background: {
      'default': '#1E1E1E'
    }
  },
  typography: {
    fontSize: 10
  },
  overrides: {
    MuiButton: {
      fab: {
        width: '24px',
        height: '24px',
        minHeight: '0px'
      }
    },
    MuiIconButton: {
      root: {
        minWidth: '0px'
      }
    }
  }
});

export class Preview extends React.Component<{}, {}> {

 render() {
   return (
     <MuiThemeProvider theme={theme}>
       <div>
         <JsonForms/>
       </div>
     </MuiThemeProvider>
   );
 }
}
