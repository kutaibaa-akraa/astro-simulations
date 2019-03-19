import React from 'react';
import PropTypes from 'prop-types';

export default class Window extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isDragging: false,
            x: 50,
            y: 50
        };

        this.onDragStart = this.onDragStart.bind(this);
        this.onDragStop = this.onDragStop.bind(this);
        this.onDrag = this.onDrag.bind(this);
    }
    render() {
        if (this.props.isHidden) {
            return null;
        }

        return (
            <div className="window"
                 style={{
                     left: this.state.x,
                     top: this.state.y
                 }}>
                <div className="window-bar"
                     onMouseDown={this.onDragStart.bind(this)}
                     onMouseUp={this.onDragStop.bind(this)}
                     onMouseMove={this.onDrag.bind(this)}>
                    <div>HR Diagram</div>
                    <span className="window-close"
                          onClick={this.props.onWindowClose}>
                        <svg viewport="0 0 12 12" version="1.1"
                             xmlns="http://www.w3.org/2000/svg">
                            <line x1="1" y1="11"
                                  x2="11" y2="1"
                                  stroke="black"
                                  strokeWidth="2"/>
                            <line x1="1" y1="1"
                                  x2="11" y2="11"
                                  stroke="black"
                                  strokeWidth="2"/>
                        </svg>
                    </span>
                </div>
                <div className="window-body"></div>
            </div>
        );

    }
    onDragStart() {
        this.setState({isDragging: true});
    }
    onDragStop() {
        this.setState({isDragging: false});
    }
    onDrag(e) {
        if (this.state.isDragging) {
            this.setState({
                x: e.pageX - 40,
                y: e.pageY - 10
            });
        }
    }
}

Window.propTypes = {
    isHidden: PropTypes.bool.isRequired,
    onWindowClose: PropTypes.func.isRequired
};
