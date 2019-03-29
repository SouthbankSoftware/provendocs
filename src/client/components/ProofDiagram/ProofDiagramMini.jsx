/*
 * @flow
 * Created Date: Saturday September 29th 2018
 * Author: Michael Harrison
 * Last Modified: Tuesday October 9th 2018 9:54:52 am
 * Modified By: Michael Harrison at <Mike@Southbanksoftware.com>
 */
/* eslint-disable no-return-assign */
import React from 'react';
import autobind from 'autobind-decorator';
import * as d3 from 'd3';
import TickIcon from '../../style/icons/pages/dashboard/tick-icon.svg';
import PendingIcon from '../../style/icons/pages/dashboard/uploading-icon.svg';
// $FlowFixMe
import './ProofDiagramMini.scss';

type Props = {
  proof: any;
};

type State = {
  diagramData: any;
  proof: Object;
  selector: any;
  selectorTwo: any;
  selectorThree: any;
  selectorFour: any;
  diagramCreated: boolean;
  center: number;
  size: Object;
};

const treeOneData = {
  name: 'A1',
  color: 'blue',
  tooltip: 'Root Hash',
  children: [
    {
      name: 'B1',
      color: 'red',
      tooltip: 'Intermediate Hash',
      children: [
        {
          name: 'C1',
          color: 'blue',
          tooltip: 'Your Document',
        },
        {
          name: 'C2',
          color: 'white',
          tooltip: 'Other Docuemnts',
        },
      ],
    },
    {
      name: 'B2',
      color: 'white',
      tooltip: 'Intermediate Hash',
      children: [
        { name: 'C3', color: 'white', tooltip: 'Other Documents' },
        { name: 'C4', color: 'white', tooltip: 'Other Documents' },
      ],
    },
  ],
};

const treeTwoData = {
  name: 'A1',
  color: 'blue',
  tooltip: 'Your Root Hash',
};

const treeThreeData = {
  name: 'A1',
  color: 'blue',
  tooltip: 'Chainpoint Root Hash',
  children: [
    {
      name: 'B1',
      color: 'white',
      tooltip: 'Intermediate Hashes',
      children: [
        {
          name: 'C1',
          color: 'white',
          tooltip: 'Other hashes',
        },
        {
          name: 'C2',
          color: 'white',
          tooltip: 'Other hashes',
        },
      ],
    },
    {
      name: 'B2',
      color: 'red',
      tooltip: 'Intermediate Hash',
      children: [
        { name: 'C3', color: 'white', tooltip: 'Other hashes' },
        { name: 'C4', color: 'blue', tooltip: 'Your Root Hash' },
      ],
    },
  ],
};

const treeFourData = {
  name: 'A1',
  color: 'blue',
  tooltip: 'Your location on the Blockchain.',
};

export default class ProofDiagramMini extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      proof: {},
      diagramData: [treeOneData, treeTwoData, treeThreeData, treeFourData],
      selector: null,
      selectorTwo: null,
      selectorThree: null,
      selectorFour: null,
      diagramCreated: false,
      center: 0,
      size: { height: 400, width: 200 },
    };
  }

  componentDidMount() {
    const { proof } = this.props;
    this.setState({ proof });
    window.addEventListener('resize', this._updateDimensions.bind(this));
  }

  componentDidUpdate() {
    const { size, diagramCreated } = this.state;
    // $FlowFixMe
    const height = document.getElementById('svg-container-1').clientHeight;
    // $FlowFixMe
    const width = document.getElementById('svg-container-1').clientWidth;
    size.height = height;
    size.width = width;
    if (width > 415) {
      size.width = 415;
    }
    if (height > 250) {
      size.height = 250;
    }
    if (width && height && !diagramCreated) {
      this._createDiagram();
    }
  }

  _updateDimensions() {
    const { size } = this.state;
    const elem = document.getElementById('svg-container-1');
    if (elem) {
      // $FlowFixMe
      const height = document.getElementById('svg-container-1').clientHeight;
      // $FlowFixMe
      const width = document.getElementById('svg-container-1').clientWidth;
      size.height = height;
      size.width = width;
      if (width > 500) {
        size.width = 500;
      }
      if (height > 250) {
        size.height = 250;
      }
      if (width && height) {
        this._createDiagram();
      }
    }
  }

  @autobind
  _createDiagramStageOne() {
    const {
      diagramData, size, selector, center,
    } = this.state;
    d3.select(selector)
      .selectAll('*')
      .remove();
    const root = d3.hierarchy(diagramData[0]);
    const treeLayout = d3.tree();
    treeLayout.size([size.width, size.height - 40]);
    treeLayout(root);

    const div = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    d3.select(selector)
      .append('svg')
      .classed('selector', true)
      .attr('viewBox', '-50 -20 550 250')
      .attr('transform', 'rotate(180) scale(1), translate(80, -30)');

    // Create Link
    this.state.center = root.x;
    this.setState({ center: root.x });
    d3.select(selector)
      .append('svg')
      .classed('link', true)
      .attr('viewBox', '-50 0 550 100')
      .attr('transform', 'rotate(180) scale(1), translate(80, -30)')
      .append('line')
      .classed('rowLink', true)
      .attr('x1', center)
      .attr('y1', root.y + 500)
      .attr('x2', center)
      .attr('y2', root.y - 500)
      .attr('stroke-dasharray', '4');

    d3.select(selector)
      .select('svg.selector')
      .selectAll('line.linkH')
      .data(root.links())
      .enter()
      .append('line')
      .classed('linkH', true)
      .attr('x1', data => data.source.x)
      .attr('y1', data => data.source.y)
      .attr('x2', data => data.target.x)
      .attr('y2', data => data.source.y);

    d3.select(selector)
      .select('svg.selector')
      .selectAll('line.linkV')
      .data(root.links())
      .enter()
      .append('line')
      .classed('linkV', true)
      .attr('x1', data => data.target.x)
      .attr('y1', data => data.source.y)
      .attr('x2', data => data.target.x)
      .attr('y2', data => data.target.y);

    // Create Nodes.
    d3.select(selector)
      .select('svg')
      .selectAll('circle.node')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('node', true)
      .attr('class', data => `${data.data.color}Stroke`)
      .attr('cx', data => data.x)
      .attr('cy', data => data.y)
      .attr('r', 20);

    d3.select(selector)
      .select('svg.selector')
      .selectAll('circle.nodeInner')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('nodeInner', true)
      .attr('class', data => `${data.data.color}Node`)
      .attr('cx', data => data.x)
      .attr('cy', data => data.y)
      .attr('r', 16)
      .on('mouseover', (d) => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html(`${d.data.tooltip}`)
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });
  }

  @autobind
  _createDiagramStageTwo() {
    const {
      diagramData, size, selectorTwo, center, proof,
    } = this.state;

    d3.select(selectorTwo)
      .selectAll('*')
      .remove();

    const root = d3.hierarchy(diagramData[1]);

    const treeLayout = d3.tree();

    treeLayout.size([size.height, size.width]);
    treeLayout(root);

    const div = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    d3.select(selectorTwo)
      .append('svg')
      .classed('selector', true)
      .attr('viewBox', '-50 0 550 250')
      .attr('transform', 'rotate(180) scale(1), translate(80, 0)');

    // Cross section Links
    d3.select(selectorTwo)
      .append('svg')
      .classed('link', true)
      .attr('viewBox', '-50 0 550 100')
      .attr('transform', 'rotate(180) scale(1), translate(80, 0)')
      .append('line')
      .classed('rowLinkV', true)
      .attr('class', `rowLinkV hide_${(proof.status === 'Pending').toString()}`)
      .attr('x1', center)
      .attr('y1', root.y + 200)
      .attr('x2', center)
      .attr('y2', root.y)
      .attr('stroke-dasharray', '4');

    d3.select(selectorTwo)
      .select('svg.link')
      .append('line')
      .classed('rowLinkH', true)
      .attr('class', `rowLinkH hide_${(proof.status === 'Pending').toString()}`)
      .attr('x1', center)
      .attr('y1', 0)
      .attr('x2', center + size.width / 2 - size.width / 8 - 16)
      .attr('y2', 0)
      .attr('stroke-dasharray', '4');

    d3.select(selectorTwo)
      .select('svg')
      .append('line')
      .classed('rowLinkV', true)
      .attr('class', `rowLinkV hide_${(proof.status === 'Pending').toString()}`)
      .attr('x1', center)
      .attr('y1', 100)
      .attr('x2', center)
      .attr('y2', -500)
      .attr('stroke-dasharray', '4');

    // Normal Tree Elements.
    d3.select(selectorTwo)
      .select('svg')
      .append('line')
      .classed('rowLinkV', true)
      .attr('x1', center)
      .attr('y1', root.y + 100)
      .attr('x2', center)
      .attr('y2', root.y + 500)
      .attr('stroke-dasharray', '4');

    // Create Nodes.
    d3.select(selectorTwo)
      .select('svg')
      .selectAll('circle.node')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('node', true)
      .attr('class', data => `${data.data.color}Stroke`)
      .attr('cx', center)
      .attr('cy', data => data.y + 100)
      .attr('r', 20);

    d3.select(selectorTwo)
      .select('svg')
      .selectAll('circle.nodeInner')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('nodeInner', true)
      .attr('class', data => `${data.data.color}Node`)
      .attr('cx', center)
      .attr('cy', data => data.y + 100)
      .attr('r', 16)
      .on('mouseover', (d) => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html(`${d.data.tooltip}`)
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });
  }

  @autobind
  _createDiagramStageThree() {
    const {
      diagramData, size, selectorThree, proof, center,
    } = this.state;

    d3.select(selectorThree)
      .selectAll('*')
      .remove();

    const root = d3.hierarchy(diagramData[2]);
    const treeLayout = d3.tree();
    treeLayout.size([size.width, size.height - 40]);
    treeLayout(root);
    // External Links
    this.state.center = root.x;
    this.setState({ center: root.x });

    const div = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    d3.select(selectorThree)
      .append('svg')
      .attr('viewBox', '-50 0 550 100')
      .attr('transform', 'rotate(180) scale(1, 2), translate(80, 0)')
      .append('line')
      .classed('rowLinkV', true)
      .classed('hide', proof.status === 'Pending')
      .attr('x1', center + size.width / 2 - size.width / 8 - 16)
      .attr('y1', size.height / 2)
      .attr('x2', center + size.width / 2 - size.width / 8 - 16)
      .attr('y2', 0)
      .attr('stroke-dasharray', '2');

    d3.select(selectorThree)
      .append('svg')
      .classed('selector', true)
      .attr('viewBox', '-50 -20 550 250')
      .attr('transform', 'rotate(180) scale(1), translate(80, -30)');

    d3.select(selectorThree)
      .append('svg')
      .classed('link', true)
      .attr('viewBox', '-50 0 550 100')
      .attr('transform', 'rotate(180) scale(1), translate(80, -30)')
      .append('line')
      .classed('rowLinkV', true)
      .classed('hide', proof.status === 'Pending' || proof.status === 'Submitted')
      .attr('x1', center)
      .attr('y1', root.y + 500)
      .attr('x2', center)
      .attr('y2', root.y - 500)
      .attr('stroke-dasharray', '4');

    // Normal Links
    d3.select(selectorThree)
      .select('svg.selector')
      .selectAll('line.linkH')
      .data(root.links())
      .enter()
      .append('line')
      .classed('linkH', true)
      .attr('x1', data => data.source.x)
      .attr('y1', data => data.source.y)
      .attr('x2', data => data.target.x)
      .attr('y2', data => data.source.y);

    d3.select(selectorThree)
      .select('svg.selector')
      .selectAll('line.linkV')
      .data(root.links())
      .enter()
      .append('line')
      .classed('linkV', true)
      .attr('x1', data => data.target.x)
      .attr('y1', data => data.source.y)
      .attr('x2', data => data.target.x)
      .attr('y2', data => data.target.y);

    // Create Nodes.
    d3.select(selectorThree)
      .select('svg.selector')
      .selectAll('circle.node')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('node', true)
      .attr('class', data => `${data.data.color}Stroke`)
      .attr('cx', data => data.x)
      .attr('cy', data => data.y)
      .attr('r', 20);

    d3.select(selectorThree)
      .select('svg.selector')
      .selectAll('circle.nodeInner')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('nodeInner', true)
      .attr(
        'class',
        data => `${data.data.color}Node hide_${(proof.status === 'Pending').toString()}`,
      )
      .attr('cx', data => data.x)
      .attr('cy', data => data.y)
      .attr('r', 16)
      .on('mouseover', (d) => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html(`${d.data.tooltip}`)
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });
  }

  @autobind
  _createDiagramStageFour() {
    const {
      diagramData, size, selectorFour, proof, center,
    } = this.state;

    const root = d3.hierarchy(diagramData[1]);

    const treeLayout = d3.tree();

    d3.select(selectorFour)
      .selectAll('*')
      .remove();

    treeLayout.size([size.height, size.width]);
    treeLayout(root);

    const div = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // Create Links
    d3.select(selectorFour)
      .append('svg')
      .classed('link', true)
      .attr('viewBox', '-50 0 550 100')
      .attr('transform', 'rotate(180) scale(1), translate(80, 10)')
      .append('line')
      .classed('rowLinkV', true)
      .classed('hide', proof.status === 'Pending' || proof.status === 'Submitted')
      .attr('x1', center)
      .attr('y1', root.y + 200)
      .attr('x2', center)
      .attr('y2', root.y)
      .attr('stroke-dasharray', '4');

    d3.select(selectorFour)
      .append('svg')
      .classed('selector', true)
      .attr('viewBox', '-50 0 550 250')
      .attr('transform', 'rotate(180) scale(1), translate(80, 0)');

    // Create Nodes.
    d3.select(selectorFour)
      .select('svg.selector')
      .selectAll('circle.node')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('node', true)
      .attr('class', data => `${data.data.color}Stroke`)
      .attr('cx', center)
      .attr('cy', data => data.y + 100)
      .attr('r', 20);

    d3.select(selectorFour)
      .select('svg.selector')
      .append('line')
      .classed('rowLinkV', true)
      .classed('hide', proof.status === 'Pending' || proof.status === 'Submitted')
      .attr('x1', center)
      .attr('y1', root.y + 300)
      .attr('x2', center)
      .attr('y2', root.y + 100)
      .attr('stroke-dasharray', '4');

    d3.select(selectorFour)
      .select('svg.selector')
      .selectAll('circle.nodeInner')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('nodeInner', true)
      .attr(
        'class',
        data => `${data.data.color}Node hide_${(
          proof.status === 'Pending' || proof.status === 'Submitted'
        ).toString()}`,
      )
      .attr('cx', center)
      .attr('cy', data => data.y + 100)
      .attr('r', 16)
      .on('mouseover', (d) => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html(`${d.data.tooltip}`)
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Other block chain blocks.
    d3.select(selectorFour)
      .select('svg.selector')
      .append('circle')
      .classed('node', true)
      .attr('class', 'whiteStroke')
      .attr('cx', center - 50)
      .attr('cy', root.y + 100)
      .attr('r', 20)
      .on('mouseover', () => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html('The next block to be constructed.')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });

    d3.select(selectorFour)
      .select('svg.selector')
      .append('circle')
      .classed('node', true)
      .attr('class', 'whiteStroke')
      .attr('cx', center + 50)
      .attr('cy', root.y + 100)
      .attr('r', 20)
      .on('mouseover', () => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html('The previous block on the chain.')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });

    d3.select(selectorFour)
      .select('svg.selector')
      .append('circle')
      .classed('node', true)
      .attr('class', 'whiteStroke')
      .attr('cx', center + 100)
      .attr('cy', root.y + 100)
      .attr('r', 20)
      .on('mouseover', () => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html('The previous block on the chain.')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });

    d3.select(selectorFour)
      .select('svg.selector')
      .append('circle')
      .classed('node', true)
      .attr('class', 'whiteStroke')
      .attr('cx', center - 100)
      .attr('cy', root.y + 100)
      .attr('r', 20)
      .on('mouseover', () => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html('The previous block on the chain.')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });
  }

  @autobind
  _createDiagram() {
    this._createDiagramStageOne();
    this._createDiagramStageTwo();
    this._createDiagramStageThree();
    this._createDiagramStageFour();
    this.setState({ diagramCreated: true });
  }

  render() {
    const { proof } = this.state;
    return (
      <div className="proofDiagramMiniWrapper">
        <div className="diagramRow One">
          <div className="rowLeft">
            {<TickIcon className="tickIcon" />}
            <span className="rowTitle">
              <b>Step 1:</b>
              {' '}
Database
            </span>
          </div>
          <div
            id="svg-container-1"
            className="svg-container"
            style={{ overflow: 'hidden' }}
            ref={selector => (this.state.selector = selector)}
          />
        </div>

        <div className="diagramRow Two">
          <div className="rowLeft">
            <TickIcon className="tickIcon" />
            <span className="rowTitle">
              <b>Step 2:</b>
              {' '}
Hash
            </span>
          </div>
          <div
            id="svg-container-2"
            className="svg-container"
            style={{ overflow: 'hidden' }}
            ref={selectorTwo => (this.state.selectorTwo = selectorTwo)}
          />
        </div>

        <div className="diagramRow three">
          <div className="rowLeft">
            {proof && proof.status && proof.status === 'Pending' ? (
              <PendingIcon className="pendingIcon" />
            ) : (
              <TickIcon className="tickIcon" />
            )}
            <span className="rowTitle">
              <b>Step 3:</b>
              {' '}
Chainpoint
            </span>
          </div>
          <div
            id="svg-container-3"
            className="svg-container"
            style={{ overflow: 'hidden' }}
            ref={selectorThree => (this.state.selectorThree = selectorThree)}
          />
        </div>

        <div className="diagramRow four">
          <div className="rowLeft">
            {proof
            && proof.status
            && (proof.status === 'Submitted' || proof.status === 'Pending') ? (
              <PendingIcon className="pendingIcon" />
              ) : (
                <TickIcon className="tickIcon" />
              )}
            <span className="rowTitle">
              <b>Step 4:</b>
              {' '}
Blockchain
            </span>
          </div>
          <div
            id="svg-container-4"
            className="svg-container"
            style={{ overflow: 'hidden' }}
            ref={selectorFour => (this.state.selectorFour = selectorFour)}
          />
        </div>
      </div>
    );
  }
}
