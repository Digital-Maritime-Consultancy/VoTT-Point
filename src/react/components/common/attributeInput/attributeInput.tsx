import React from "react";
import { IAssetMetadata, IAttributeKey, IProject, IRegion } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import AttributeInputItem from "./attributeInputItem";

export interface IAttributeInputProps{
    attributeKeys?: IAttributeKey[];
    onChange?: (key: string, value: string) => void;
    onSelectedRegionsChanged?: (regions: IRegion[]) => void;
    onAttributesUpdated: (key: string, value) => void;
}

/**
 * @name - Attribute input
 * @description - Input for attributes of region, which is a dictionary
 */
export default class AttributeInput extends React.Component<IAttributeInputProps> {
    public static defaultProps: IAttributeInputProps = {
        attributeKeys: [],
        onChange: undefined,
        onSelectedRegionsChanged: undefined,
        onAttributesUpdated: undefined,
    };

    constructor(props) {
        super(props);
    }

    public setSelectedAttributes(attributes: { [key: string]: string; }) {
        this.props.attributeKeys.forEach(({name}) => {
            let input = document.getElementById(`attr-input-${name}`) as HTMLInputElement;
            input.value = attributes[name] ? attributes[name] : "";
        });
    }

    public render() {
        return (
            <>
            {
                this.props.attributeKeys && this.props.attributeKeys.length > 0 ?
                <div className="condensed-list" onClick={(e) => e.stopPropagation()}>
                    <div className="condensed-list-header p-2">
                        <span className="condensed-list-title">
                            {strings.projectSettings.attributeKeys.title}
                        </span>
                    </div>
                    <div className="condensed-list-body">
                        <div className="tag-input-items">
                        {
                            this.props.attributeKeys.map(({name, description}) =>
                                <AttributeInputItem
                                    key={name}
                                    name={name} 
                                    description={description}
                                    onAttributesUpdated={this.props.onAttributesUpdated}
                                />
                            )
                        }
                        </div>
                    </div>
                </div> :
                <div></div>
            }
            </>
        );
    }
}
