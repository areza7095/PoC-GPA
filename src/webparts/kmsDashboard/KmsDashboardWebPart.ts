import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { initializeIcons } from '@fluentui/react';
import { spfi, type SPFI } from '@pnp/sp';
import { SPFx, type ISPFXContext } from '@pnp/sp/behaviors/spfx';

import * as strings from 'KmsDashboardWebPartStrings';
import KmsDashboard from './components/KmsDashboard';
import { IKmsDashboardProps } from './components/IKmsDashboardProps';

initializeIcons();

export interface IKmsDashboardWebPartProps {
  title: string;
  listName: string;
  showSearch: boolean;
  showFilter: boolean;
  openInNewTab: boolean;
}

export default class KmsDashboardWebPart extends BaseClientSideWebPart<IKmsDashboardWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _root: Root | undefined;
  private _sp!: SPFI; // created lazily, see createSp()

  private createSp(): SPFI {
    // SPFx() expects the web part context: it reads context.pageContext.web.absoluteUrl
    // and context.pageContext.legacyPageContext internally.
    return spfi().using(SPFx(this.context as unknown as ISPFXContext));
  }

  public render(): void {
    if (!this._sp) {
      this._sp = this.createSp();
    }

    const element: React.ReactElement<IKmsDashboardProps> = React.createElement(
      KmsDashboard,
      {
        sp: this._sp,
        title: this.properties.title || 'All wiki spaces',
        listName: this.properties.listName || 'Wiki Spaces',
        showSearch: this.properties.showSearch !== false,
        showFilter: this.properties.showFilter !== false,
        openInNewTab: !!this.properties.openInNewTab
      }
    );

    if (!this._root) {
      this._root = createRoot(this.domElement);
    }

    this._root.render(element);
  }

  protected onInit(): Promise<void> {
    this._sp = this.createSp();
    return super.onInit();
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;

    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || '');
      this.domElement.style.setProperty('--link', semanticColors.link || '');
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || '');
      this.domElement.style.setProperty('--kms-card-bg', semanticColors.bodyBackground || '');
      this.domElement.style.setProperty('--kms-card-border', semanticColors.bodyDivider || '');
      this.domElement.style.setProperty('--kms-subtle-text', semanticColors.bodySubtext || '');
      this.domElement.style.setProperty('--kms-accent', semanticColors.link || '');
    }
  }

  protected onDispose(): void {
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.SettingsGroupName,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: strings.TitleFieldLabel
                }),
                PropertyPaneTextField('listName', {
                  label: strings.ListNameFieldLabel
                }),
                PropertyPaneToggle('showSearch', {
                  label: strings.ShowSearchLabel,
                  onText: strings.OnLabel,
                  offText: strings.OffLabel
                }),
                PropertyPaneToggle('showFilter', {
                  label: strings.ShowFilterLabel,
                  onText: strings.OnLabel,
                  offText: strings.OffLabel
                }),
                PropertyPaneToggle('openInNewTab', {
                  label: strings.OpenInNewTabLabel,
                  onText: strings.OnLabel,
                  offText: strings.OffLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
