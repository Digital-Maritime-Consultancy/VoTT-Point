import React from "react";

export interface IAttributeInputItemProps {
    name: string;
    description: string;
    onAttributesUpdated: (key: string, value) => void;
}

export default class AttributeInputItem extends React.Component<IAttributeInputItemProps> {
    public static defaultProps: IAttributeInputItemProps = {
        name: "",
        description: "",
        onAttributesUpdated: undefined,
    };

    public render() {
        return (
            <div className="tag-item row">
                <div className="col">
                    <span className="p-2">{this.props.name}</span>
                </div>
                <div className="col">
                    <input
                        type="text"
                        id={`attr-input-${this.props.name}`}
                        key={this.props.name}
                        placeholder={this.props.description}
                        onChange={(e) =>
                            this.props.onAttributesUpdated(this.props.name, e.currentTarget.value)
                        }
                    />
                </div>
            </div>
        );
    }
}