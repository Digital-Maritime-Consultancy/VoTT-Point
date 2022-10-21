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
            <div className="tag-item-block">
                <div className="tag-content" style={{background: "rgb(27, 32, 36)"}}>
                    <div>
                        <span className="p-1">{this.props.name}</span>
                    </div>
                    <div>
                        <input
                            className="w-100 p-1"
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
            </div>
        );
    }
}