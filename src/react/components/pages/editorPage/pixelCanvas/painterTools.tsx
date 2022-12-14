import React from "react";


export interface IPainterToolsProps{
    fullWidth: number;
    fullHeight: number;
    canvasContainer: React.RefObject<HTMLDivElement>;
}

export default class PainterTools extends React.Component<IPainterToolsProps> {
    private isDrawing: boolean = false;
    private isDragging: boolean = false;
    private canvasZone: React.RefObject<HTMLDivElement> = React.createRef();
    private canvasForeground: React.RefObject<HTMLCanvasElement> = React.createRef();
    private canvasBackground: React.RefObject<HTMLCanvasElement> = React.createRef();

    public componentDidMount(): void {
        this.initiateInteraction();
    }

    public render = () => {
        return <div id="editorDiv" className="CanvasToolsContainer" onClick={(e) => e.preventDefault()}>
            <div className="CanvasTools" ref={this.canvasZone}>
                <canvas ref={this.canvasForeground}
                    width={this.props.fullWidth}
                    height={this.props.fullHeight}
                />
                <canvas ref={this.canvasBackground}
                    width={this.props.fullWidth}
                    height={this.props.fullHeight}
                />
            </div>
        </div>;
    }

    /**
     * Updates the content source for the editor.
     * @param source - Content source.
     * @returns A new `Promise` resolved when content is drawn and Editor is resized.
     */
     public async addContentSource(source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement): Promise<void> {
        const context = this.canvasForeground.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
        context.globalCompositeOperation = 'destination-over';
        context.fillStyle = "blue";
        context.fillRect(0, 0, this.props.fullWidth, this.props.fullHeight);

        //this.canvasForeground.current.width = this.sourceWidth;
        //this.canvasForeground.current.height = this.sourceHeight;

        //this.zoomEditorToScale(this.sourceWidth, this.sourceHeight);
        //this.initiateInteraction();
        //this.canvasBackground.current.width = this.sourceWidth;
        //this.canvasBackground.current.height = this.sourceHeight;

        const bgContext = this.canvasBackground.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
        bgContext.drawImage(source, 0, 0, this.canvasBackground.current.width, this.canvasBackground.current.height);
    }

    public componentWillUnmount() {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
    }

    public getPixels = () => {
        /*
        const context = this.canvasForeground.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
        for (let top = 0; top < this.sourceHeight; top++) {
            for (let left = 0; left < this.sourceHeight; left++) {
                const value = context.getImageData(left, top, 1, 1).data;
            }
        }
        */
    }

    /**
     * Helper function to zoom the editor to given scale.
     */
     private zoomEditorToScale(
        scaledFrameWidth: number,
        scaledFrameHeight: number,
        //zoomData: ZoomData,
        //cursorPos?: CursorPosition
    ): void {
        const editorContainerDiv = this.props.canvasContainer.current;
        const editorDiv = this.canvasZone.current;
        if (editorContainerDiv) {
            // scroll
            //editorContainerDiv.style.overflow = zoomData.currentZoomScale === 1 ? "hidden" : "auto";
            const containerWidth = editorContainerDiv.offsetWidth;
            const containerHeight = editorContainerDiv.offsetHeight;

            let hpadding = 0;
            let vpadding = 0;

            if (scaledFrameWidth < containerWidth) {
                hpadding = (containerWidth - scaledFrameWidth) / 2;
                editorDiv.style.width = `calc(100% - ${hpadding * 2}px)`;
            } else {
                editorDiv.style.width = `${scaledFrameWidth}px`;
            }

            if (scaledFrameHeight < containerHeight) {
                vpadding = (containerHeight - scaledFrameHeight) / 2;
                editorDiv.style.height = `calc(100% - ${vpadding * 2}px)`;
            } else {
                editorDiv.style.height = `${scaledFrameHeight}px`;
            }

            // existence of either a vertical or horizontal scroll bar
            // clientWidth is the offsetWidth - scrollbarWidth
            if (hpadding && !vpadding) {
                hpadding = (editorContainerDiv.clientWidth - scaledFrameWidth) / 2;
                editorDiv.style.width = `calc(100% - ${hpadding * 2}px)`;
            }

            if (!hpadding && vpadding) {
                vpadding = (editorContainerDiv.clientHeight - scaledFrameHeight) / 2;
                editorDiv.style.height = `calc(100% - ${vpadding * 2}px)`;
            }

            editorDiv.style.padding = `${vpadding}px ${hpadding}px`;
            // focus on the editor container div so that scroll bar can be used via arrow keys
            editorContainerDiv.focus();

            /*
            // Case: 1: ZoomType.ImageCenter ---- when the zooming is around the actual center of the image
            if (this.zoomManager.zoomType === ZoomType.ImageCenter) {
                if (editorContainerDiv.scrollHeight > editorContainerDiv.clientHeight) {
                    editorContainerDiv.scrollTop =
                        (this.editorDiv.clientHeight - editorContainerDiv.clientHeight) / 2;
                }

                if (editorContainerDiv.scrollWidth > editorContainerDiv.clientWidth) {
                    editorContainerDiv.scrollLeft =
                        (this.editorDiv.clientWidth - editorContainerDiv.clientWidth) / 2;
                }
            }

             // Case: 2: ZoomType.CursorCenter when zooming is based on cursor position
             if (this.zoomManager.zoomType === ZoomType.CursorCenter && cursorPos) {
                // get the current scroll position
                const currentScrollPos = {
                    left: editorContainerDiv.scrollLeft,
                    top: editorContainerDiv.scrollTop,
                };

                // get current mouse pos
                const mousePos = {
                    x: cursorPos.x,
                    y: cursorPos.y
                }

                // get scaled mouse pos after zoom
                const scaledMousePos = {
                    x: (mousePos.x / zoomData.previousZoomScale) * zoomData.currentZoomScale,
                    y: (mousePos.y / zoomData.previousZoomScale) * zoomData.currentZoomScale
                }

                 // get the difference between the expected scaled viewport center and current viewport center
                 const expectedScrollPosDifference = {
                    left: scaledMousePos.x - mousePos.x,
                    top: scaledMousePos.y - mousePos.y,
                };

                // get the expected scaled scroll position
                const expectedScrollPos = {
                    left: currentScrollPos.left + expectedScrollPosDifference.left,
                    top: currentScrollPos.top + expectedScrollPosDifference.top,
                };

                editorContainerDiv.scrollLeft = expectedScrollPos.left;
                editorContainerDiv.scrollTop = expectedScrollPos.top;
            }

            // Case 3: ZoomType.ViewportCenter
            // when the zooming is around the center of the image currently in the view port of editor container.
            if (this.zoomManager.zoomType === ZoomType.ViewportCenter || !cursorPos) {
                // get the current scroll position
                const currentScrollPos = {
                    left: editorContainerDiv.scrollLeft,
                    top: editorContainerDiv.scrollTop,
                };

                // get the current center of the viewport
                const currentCenterInView = {
                    x: editorContainerDiv.clientWidth / 2 + currentScrollPos.left,
                    y: editorContainerDiv.clientHeight / 2 + currentScrollPos.top,
                };

                // get the current center of the viewport once its is scaled based on zoom data
                const zoomedCenterInView = {
                    x: (currentCenterInView.x / zoomData.previousZoomScale) * zoomData.currentZoomScale,
                    y: (currentCenterInView.y / zoomData.previousZoomScale) * zoomData.currentZoomScale
                };

                // get the difference between the expected scaled viewport center and current viewport center
                const expectedScrollPosDifference = {
                    left: zoomedCenterInView.x - currentCenterInView.x,
                    top: zoomedCenterInView.y - currentCenterInView.y,
                };

                // get the expected scaled scroll position
                const expectedScrollPos = {
                    left: currentScrollPos.left + expectedScrollPosDifference.left,
                    top: currentScrollPos.top + expectedScrollPosDifference.top,
                };

                editorContainerDiv.scrollLeft = expectedScrollPos.left;
                editorContainerDiv.scrollTop = expectedScrollPos.top;
            }
            */
        }
    }

    private initiateInteraction = () => {
        this.canvasZone.current.onmousemove = this.onMouseMove;
        this.canvasZone.current.onmousedown = this.onMouseDown;
        this.canvasZone.current.onmouseup = this.onMouseUp;
        this.canvasZone.current.onwheel = this.onWheelCapture;
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
    }

    private getCanvasCoordinates = (event) => {
        const canvas = this.props.canvasContainer.current;
        return {
            x: event.clientX - canvas.getBoundingClientRect().left,
            y: event.clientY - canvas.getBoundingClientRect().top};
    }

    private onKeyDown = (event) => {
        if (event.key === "Alt") {
            this.isDragging = true;
            this.canvasZone.current.style.cursor = "move";
        }
    }

    private onKeyUp = (event) => {
        if (event.key === "Alt") {
            this.isDragging = false;
            this.canvasZone.current.style.cursor = "default";
        }
    }

    private onMouseDown = (event) => {
        if (!this.isDragging) {
            const context = this.canvasForeground.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
            context.beginPath();
            const boundings = this.canvasForeground.current.getBoundingClientRect();
            context.moveTo(event.clientX - boundings.left, event.clientY - boundings.top);
            context.lineCap = "round";
            context.lineJoin = "round";
            // set line color
            context.strokeStyle = '#ff0000';
            this.isDrawing = true;
        }
    }

    private onMouseMove = (event) => {
        const context = this.canvasForeground.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
        if (!this.isDragging && this.isDrawing) {
            const boundings = this.canvasForeground.current.getBoundingClientRect();
            context.lineTo(event.clientX - boundings.left, event.clientY - boundings.top);
            context.stroke();
        } else if (this.isDragging) {
            const pos = this.getCanvasCoordinates(event);
            this.props.canvasContainer.current.scrollLeft = pos.x;
            console.log(this.props.canvasContainer.current.scrollLeft);
            console.log(this.canvasZone.current.scrollLeft);
        }
    }

    private onMouseUp = (event) => {
        this.isDrawing = false;
        this.getPixels();
    }

    private getCursorPos = (e: any) => {
        const editorContainer = document.getElementsByClassName("CanvasToolsEditor")[0];
        e = e || window.event;
        /*get the x and y positions of the container:*/
        const containerPos = editorContainer.getBoundingClientRect();

        /*get the x and y positions of the image:*/
        const editorStyles = window.getComputedStyle(editorContainer);
        const imagePos = {
            left: containerPos.left + parseFloat(editorStyles.paddingLeft),
            top: containerPos.top + parseFloat(editorStyles.paddingTop),
        };

        let x = 0;
        let y = 0;
        /*calculate the cursor's x and y coordinates, relative to the image:*/
        x = e.pageX - imagePos.left;
        y = e.pageY - imagePos.top;
        /*consider any page scrolling:*/
        x = x - window.pageXOffset;
        y = y - window.pageYOffset;
        return {x, y};
    }

    private onWheelCapture = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.isDragging) {
            const context = this.canvasForeground.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
            console.log(context);
            context.scale(0.1, 0.1);
            //context.drawImage(source, 0, 0, this.canvasZone.current.width, this.canvasZone.current.height);
        } else {
            const context = this.canvasForeground.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
            console.log(e.deltaY);
            if (e.deltaY > 0) {
                context.lineWidth = context.lineWidth + 1;
            } else {
                context.lineWidth = context.lineWidth < 1 ? 1 : context.lineWidth - 1;
            }
        }
    }
}