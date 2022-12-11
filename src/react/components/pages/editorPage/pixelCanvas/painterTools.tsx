import React from "react";


export interface IPainterToolsProps{
    canvasContainer: React.RefObject<HTMLDivElement>;
}

export default class PainterTools extends React.Component<IPainterToolsProps> {
    private sourceWidth: number;
    private sourceHeight: number;
    private isDrawing: boolean = false;
    private isDragging: boolean = false;
    private canvasZone: React.RefObject<HTMLCanvasElement> = React.createRef();
    private canvasBackground: React.RefObject<HTMLCanvasElement> = React.createRef();

    public render = () => {
        return <div id="editorDiv">
            <canvas id="CanvasToolsEditor" ref={this.canvasZone}
                width={this.sourceWidth}
                height={this.sourceHeight}
            >
            </canvas>
            <canvas id="canvasBackground" ref={this.canvasBackground}
                width={this.sourceWidth}
                height={this.sourceHeight}
            >
            </canvas>
        </div>
    }

    /**
     * Updates the content source for the editor.
     * @param source - Content source.
     * @returns A new `Promise` resolved when content is drawn and Editor is resized.
     */
     public async addContentSource(source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement): Promise<void> {
        const context = this.canvasZone.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;

        if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
            this.sourceWidth = source.width;
            this.sourceHeight = source.height;
        } else if (source instanceof HTMLVideoElement) {
            this.sourceWidth = source.videoWidth;
            this.sourceHeight = source.videoHeight;
        }

        this.canvasZone.current.width = this.sourceWidth;
        this.canvasZone.current.height = this.sourceHeight;

        //context.drawImage(source, 0, 0, this.canvasZone.current.width, this.canvasZone.current.height);
        this.canvasZone.current.onmousemove = this.onMouseMove;
        this.canvasZone.current.onmousedown = this.onMouseDown;
        this.canvasZone.current.onmouseup = this.onMouseUp;
        this.canvasZone.current.onwheel = this.onWheelCapture;
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
    }

    public componentWillUnmount() {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
    }

    public getPixels = () => {
        const context = this.canvasZone.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
        for (let top = 0; top < this.sourceHeight; top++) {
            for (let left = 0; left < this.sourceHeight; left++) {
                const value = context.getImageData(left, top, 1, 1).data;
            }
        }
    }

    private getCanvasCoordinates = (event) => {
        const canvas = this.canvasZone.current;
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
            const context = this.canvasZone.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
            context.beginPath();
            const boundings = this.canvasZone.current.getBoundingClientRect();
            context.moveTo(event.clientX - boundings.left, event.clientY - boundings.top);
            context.lineCap = "round";
            context.lineJoin = "round";
            // set line color
            context.strokeStyle = '#ff0000';
            this.isDrawing = true;
        }
    }

    private onMouseMove = (event) => {
        const context = this.canvasZone.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
        if (!this.isDragging && this.isDrawing) {
            const boundings = this.canvasZone.current.getBoundingClientRect();
            context.lineTo(event.clientX - boundings.left, event.clientY - boundings.top);
            context.stroke();
        } else if (this.isDragging) {
            const pos = this.getCanvasCoordinates(event);
            
            this.props.canvasContainer.current.scrollLeft = pos.x;
            console.log(this.props.canvasContainer.current.scrollLeft);
            console.log(this.canvasZone.current.scrollLeft);
            //console.log(pos);
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
            const context = this.canvasZone.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
            console.log(context);
            context.scale(0.1, 0.1);
            //context.drawImage(source, 0, 0, this.canvasZone.current.width, this.canvasZone.current.height);
        } else {
            const context = this.canvasZone.current.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
            console.log(e.deltaY);
            if (e.deltaY > 0) {
                context.lineWidth = context.lineWidth + 1;
            } else {
                context.lineWidth = context.lineWidth < 1 ? 1 : context.lineWidth - 1;
            }
        }
    }
}