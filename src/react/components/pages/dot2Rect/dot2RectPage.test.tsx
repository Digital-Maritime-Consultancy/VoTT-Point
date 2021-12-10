import React from "react";
import Dot2RectPage, { IDot2RectPageProps, IDot2RectPageState } from "./dot2RectPage";
import { ReactWrapper, mount } from "enzyme";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import createReduxStore from "../../../../redux/store/store";
import MockFactory from "../../../../common/mockFactory";
import { Dot2RectForm } from "./dot2RectForm";
import { IDot2RectSettings, ModelPathType } from "../../../../models/applicationState";
jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";
import { toast } from "react-toastify";
import { strings } from "../../../../common/strings";

describe("Dot 2 Rect Page", () => {
    function createComponent(store, props: IDot2RectPageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router>
                    <Dot2RectPage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeAll(() => {
        toast.success = jest.fn(() => 2);
    });
});
