import React, { ComponentType, FunctionComponent } from "react";
import * as ReactIs from "react-is";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { withRouter, match } from "react-router-dom";
import { Location, History } from "history";
import { User } from "./reducers/userManagementReducer";
import { requestSignOut, requestWhoAmI } from "./actions/userManagementActions";
import { fetchContent } from "./actions/contentActions";
import { config, ConfigDataType } from "./config";
import { ParsedDataset } from "./helpers/record";

/**
 * The constant define the prefix that is used to create the global scope variable name `MagdaPluginComponentxxxx`, to which the external UI plugin bundle should export to.
 * Here, `xxxx` is the plugin UI component type name
 * e.g. The Header Component should bundled & export to global scope variable `MagdaPluginComponentHeader`.
 *
 * The currently support all type names are:
 * - Header
 * - Footer
 * - DatasetEditButton
 * - DatasetLikeButton
 * - ExtraVisualisationSection
 *
 * Please refer to `External UI Plugin Component Types Type Aliases` section for functionality of each plugin UI component type.
 *
 * > Since Magda v2.2.0, users can load more than one "Extra Visualisation Section" type Magda UI Plugin Components.
 * To allow this, the component is required to be packaged as a library and exported to global scope `MagdaPluginComponentExtraVisualisationSection.xxxx`.
 * Here, `MagdaPluginComponentExtraVisualisationSection` should be an object with key `xxxx` set to the plugin component.
 * e.g. the [DAP image gallery plugin](https://github.com/magda-io/magda-ui-plugin-component-dap-image-gallery) choose to export itself to `MagdaPluginComponentExtraVisualisationSection.DAPImageGallery`.
 */
export const PREFIX = "MagdaPluginComponent";

/**
 * The common properties that all external UI plugins will receive.
 *
 * @export
 * @interface CommonPropsType
 */
export interface CommonPropsType {
    /**
     * Whether or not the user profile loading request is still in progress.
     *
     * @type {boolean}
     * @memberof CommonPropsType
     */
    isFetchingWhoAmI: boolean;

    /**
     * the user profile data including roles, permission & orgUnit information.
     *
     * @type {User}
     * @memberof CommonPropsType
     */
    user: User;

    /**
     * When it's not `null`, this fields contains the error thrown by the user profile loading request
     */
    whoAmIError: Error | null;

    /**
     * The `config` field contains all frontend config data fields.
     * External UI plugin developer might be interested in `config.extraConfigData` field.
     * `config.extraConfigData` field serves as an interface to config external UI plugin at deployment time.
     * External UI plugin related config data can be supplied via [web-server](https://github.com/magda-io/magda/tree/master/deploy/helm/internal-charts/web-server) helm chart.
     *
     * @type {ConfigDataType}
     * @memberof CommonPropsType
     */
    config: ConfigDataType;

    /**
     * The [history object](https://github.com/remix-run/history/blob/v4/docs/Navigation.md) that you can use to control application navigation.
     * e.g. switch to a new url.
     *
     * @type {History<any>}
     * @memberof CommonPropsType
     */
    history: History<any>;

    /**
     * The [location object](https://github.com/remix-run/history/blob/v4/docs/GettingStarted.md#listening) object implements
     * a subset of [the window.location interface](https://developer.mozilla.org/en-US/docs/Web/API/Location).
     *
     * @type {Location<any>}
     * @memberof CommonPropsType
     */
    location: Location<any>;

    /**
     * The match data is about a route at the given path relative to the current location.
     * It's generated by [react-router](https://v5.reactrouter.com/web/api/match).
     *
     * @type {match<any>}
     * @memberof CommonPropsType
     */
    match: match<any>;

    /**
     * When called, this function will dispatch the `sign out` action to sign the current user out.
     *
     * @memberof CommonPropsType
     */
    requestSignOut: () => Promise<void>;

    /**
     * When called, this function will dispatch an action to force the current user profile data to be reloaded / refreshed.
     * You may only want to call it after you just modified the user's profile.
     *
     * @memberof CommonPropsType
     */
    requestWhoAmI: () => Promise<void>;

    /**
     * When called, this function will dispatch an action to make all client side resource items (e.g. header & footer items etc.)
     * to be reloaded. You may only want to call it after the current user profile changed or any content items have been updated.
     * You can optionally passing a boolean parameter `noCache` to control the cache behaviour during the loading.
     * Its default value is `false`.
     *
     * @memberof CommonPropsType
     */
    fetchContent: (noCache?: boolean) => Promise<void>;

    /**
     * An optional property contains a list of names of plugin components who are mounted to replace a built-in component.
     * Only available for component types that supports more than one plugins to be mounted.
     * e.g. `ExtraVisualisationSection` plugin components.
     * When more than one components are mounted to replace a built-in component, each of the plugin component will receive this property.
     *
     * @type {string[]}
     * @memberof CommonPropsType
     */
    loadedPluginNames?: string[];
}

type InternalInterfaceProps<FullComponentProps> = Omit<
    FullComponentProps,
    keyof CommonPropsType
>;

const mapStateToProps = (state) => {
    const { userManagement, isFetchingWhoAmI, whoAmIError } = state;

    return {
        user: userManagement.user,
        isFetchingWhoAmI,
        whoAmIError,
        config
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(
        {
            requestSignOut,
            requestWhoAmI,
            fetchContent
        },
        dispatch
    );
};

function isValidElementType(c: any): boolean {
    if (!c || typeof c === "string") {
        return false;
    }
    return ReactIs.isValidElementType(c);
}

export function getComponentByRef<T>(
    componentRef: any
): ComponentType<InternalInterfaceProps<T>> | null {
    if (!componentRef) {
        return null;
    }

    const component =
        componentRef?.default && isValidElementType(componentRef.default)
            ? componentRef.default
            : isValidElementType(componentRef)
            ? componentRef
            : null;

    if (!component) {
        return null;
    }

    return (withRouter(
        connect(mapStateToProps, mapDispatchToProps)(component as any)
    ) as unknown) as ComponentType<InternalInterfaceProps<T>>;
}

/**
 * Used internally to locate the plugin component & create HOC with common properties prefilled.
 *
 * @export
 * @template T The type includes all plugin component properties including common properties.
 * @param {string} name
 * @return {*}  {(ComponentType<InternalInterfaceProps<T>> | null)}
 */
export function getComponent<T>(
    name: string
): ComponentType<InternalInterfaceProps<T>> | null {
    const fullComponentName = `${PREFIX}${name}`;
    const ExternalComponent: ComponentType<T> = window?.[fullComponentName]
        ?.default
        ? window[fullComponentName].default
        : window?.[fullComponentName]
        ? window[fullComponentName]
        : null;

    return getComponentByRef<T>(ExternalComponent);
}

const wrapComponentWithProps = <T, TP>(
    component: ComponentType<T>,
    overwriteProps: TP
): FunctionComponent<Omit<T, keyof TP>> => (props) => {
    const { children, ...restProps } = props;
    return React.createElement(
        component,
        ({
            ...(restProps ? restProps : {}),
            ...overwriteProps
        } as unknown) as T,
        children
    );
};

export function getMultipleComponents<T>(
    name: string
): ComponentType<InternalInterfaceProps<T>>[] | null {
    const exportedScopeName = `${PREFIX}${name}`;
    const exportedValue: any = window?.[exportedScopeName]?.default
        ? window[exportedScopeName].default
        : window?.[exportedScopeName]
        ? window[exportedScopeName]
        : null;

    if (!exportedValue) {
        return null;
    }
    const signleComponent = getComponentByRef<T>(exportedValue);

    if (signleComponent) {
        return [signleComponent];
    }

    /**
     * multiple plugin component exported scope must be an object hash
     * i.e.
     * {
     *    [key: string]: ComponentType<T>
     * }
     */
    if (typeof exportedValue !== "object") {
        return null;
    }

    const extraPluginNames = [] as string[];
    const pluginComponents: ComponentType<InternalInterfaceProps<T>>[] = [];
    const keys = Object.keys(exportedValue);
    if (!keys?.length) {
        return null;
    }
    keys.forEach((key) => {
        const pluginComponent = getComponentByRef<T>(
            exportedValue[key]
        ) as ComponentType<InternalInterfaceProps<T>>;
        if (pluginComponent) {
            extraPluginNames.push(key);
            pluginComponents.push(pluginComponent);
        }
    });
    const wrappedPluginComponents = pluginComponents.map((item) =>
        wrapComponentWithProps(item, {
            loadedPluginNames: extraPluginNames
        })
    );

    return wrappedPluginComponents as ComponentType<
        InternalInterfaceProps<T>
    >[];
}

/**
 * The type of Header Navigation Item
 *
 * @export
 * @interface HeaderNavItem
 */
export interface HeaderNavItem {
    default?: {
        href: string;
        label: string;
        rel?: string;
        target?: string;
    };
    auth?: Record<string, never>;
    order: number;
}

/**
 * The properties that Header Plugin Component will receive.
 *
 * @export
 * @interface FooterComponentPropsType
 * @extends {CommonPropsType}
 */
export interface HeaderComponentProps extends CommonPropsType {
    headerNavItems: HeaderNavItem[];
}

/**
 * Header external plugin component type
 * @category External UI Plugin Component Types
 */
export type HeaderComponentType = ComponentType<HeaderComponentProps>;

export function getPluginHeader(): ComponentType<
    InternalInterfaceProps<HeaderComponentProps>
> | null {
    return getComponent<HeaderComponentProps>("Header");
}

/**
 * Footer copyright config item
 *
 * @export
 * @interface CopyRightItem
 */
export interface CopyRightItem {
    href: string;
    htmlContent: string;
    logoSrc: string;
    order: number;
}

/**
 * Footer Navigation Link Config Item
 *
 * @export
 * @interface FooterNavLink
 */
export interface FooterNavLink {
    href: string;
    label: string;
    order: number;
}

/**
 * Footer Navigation Link Group
 *
 * @export
 * @interface FooterNavLinkGroup
 */
export interface FooterNavLinkGroup {
    label: string;
    links: FooterNavLink[];
    order: number;
}

/**
 * The properties that Footer Plugin Component will receive.
 *
 * @export
 * @interface FooterComponentPropsType
 * @extends {CommonPropsType}
 */
export interface FooterComponentPropsType extends CommonPropsType {
    noTopMargin: boolean;
    footerMediumNavs: FooterNavLinkGroup[];
    footerSmallNavs: FooterNavLinkGroup[];
    footerCopyRightItems: CopyRightItem[];
}

/**
 * Footer external plugin component type
 * @category External UI Plugin Component Types
 */
export type FooterComponentType = ComponentType<FooterComponentPropsType>;

export function getPluginFooter(): ComponentType<
    InternalInterfaceProps<FooterComponentPropsType>
> | null {
    return getComponent<FooterComponentPropsType>("Footer");
}

/**
 * The properties that DatasetEditButton Plugin Component will receive.
 *
 * @export
 * @interface FooterComponentPropsType
 * @extends {CommonPropsType}
 */
export interface DatasetEditButtonComponentPropsType extends CommonPropsType {
    dataset: ParsedDataset;
}

/**
 * Dataset page `Edit Dataset` button external plugin component type
 * @category External UI Plugin Component Types
 */
export type DatasetEditButtonComponentType = ComponentType<
    DatasetEditButtonComponentPropsType
>;

export function getPluginDatasetEditButton(): ComponentType<
    InternalInterfaceProps<DatasetEditButtonComponentPropsType>
> | null {
    return getComponent<DatasetEditButtonComponentPropsType>(
        "DatasetEditButton"
    );
}

/**
 * The properties that DatasetLikeButton Plugin Component will receive.
 *
 * @export
 * @interface FooterComponentPropsType
 * @extends {CommonPropsType}
 */
export interface DatasetLikeButtonComponentPropsType extends CommonPropsType {
    dataset: ParsedDataset;
}

/**
 * Search Result page `Like Button` external plugin component type
 * Please note: the `Like Button` on search result page is hidden unless a plugin component is supplied.
 * @category External UI Plugin Component Types
 */
export type DatasetLikeButtonComponentType = ComponentType<
    DatasetLikeButtonComponentPropsType
>;

export function getPluginDatasetLikeButton(): ComponentType<
    InternalInterfaceProps<DatasetLikeButtonComponentPropsType>
> | null {
    return getComponent<DatasetLikeButtonComponentPropsType>(
        "DatasetLikeButton"
    );
}

/**
 * The properties that ExtraVisualisationSection Plugin Component will receive.
 *
 * @export
 * @interface FooterComponentPropsType
 * @extends {CommonPropsType}
 */
export interface ExtraVisualisationSectionComponentPropsType
    extends CommonPropsType {
    dataset: ParsedDataset;
    distributionId?: string;
}

/**
 * Visualisation Section external plugin component type.
 * This plugin will be mounted on dataset or distribution page.
 * More info & example please refer to repo: [magda-ui-plugin-component-dap-image-gallery](https://github.com/magda-io/magda-ui-plugin-component-dap-image-gallery)
 * @category External UI Plugin Component Types
 */
export type ExtraVisualisationSectionComponentType = ComponentType<
    ExtraVisualisationSectionComponentPropsType
>;

export function getPluginExtraVisualisationSections():
    | ComponentType<
          InternalInterfaceProps<ExtraVisualisationSectionComponentPropsType>
      >[]
    | null {
    return getMultipleComponents("ExtraVisualisationSection");
}
