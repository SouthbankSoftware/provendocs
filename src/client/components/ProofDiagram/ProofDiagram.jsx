/* @flow
 * provendocs
 * Copyright (C) 2019  Southbank Software Ltd.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * @Author: Michael Harrison
 * @Date:   2019-03-29T10:46:51+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-04-03T09:18:20+11:00
 */
import React from 'react';
import autobind from 'autobind-decorator';
import * as d3 from 'd3';
import { Button } from 'antd';
import { Tooltip, Position } from '@blueprintjs/core';
import { PROOF_STATUS } from '../../common/constants';
import { Loading } from '../Common';
import TickIcon from '../../style/icons/pages/dashboard/tick-icon.svg';
import PendingIcon from '../../style/icons/pages/dashboard/uploading-icon.svg';
import HashCollectionIcon from '../../style/icons/pages/history-view-page/hash-collection-icon.svg';
import DocumentsIcon from '../../style/icons/pages/history-view-page/documents-icon.svg';
import StackIcon from '../../style/icons/pages/history-view-page/stack-icon.svg';
import InfoIcon from '../../style/icons/pages/history-view-page/info-icon.svg';
import KeyIcon from '../../style/icons/pages/history-view-page/key-icon.svg';
import ChainIcon from '../../style/icons/pages/history-view-page/chain-icon.svg';
import BitcoinIcon from '../../style/icons/pages/history-view-page/bitcoin-icon.svg';
import TransactionIcon from '../../style/icons/pages/history-view-page/transaction-icon.svg';
// $FlowFixMe
import './ProofDiagram.scss';

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

type Props = {
  proof: any;
  file: any;
};

type State = {
  proof: Object;
  diagramCreated: boolean;
  diagramData: any;
  size: Object;
  selector: any;
  file: Object;
  center: any;
};

export default class ViewDocument extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      proof: {},
      file: {},
      selector: null,
      center: null,
      diagramCreated: false,
      diagramData: [treeOneData, treeTwoData, treeThreeData, treeFourData],
      size: { height: 400, width: 200 },
    };
  }

  componentDidMount() {
    const { proof, file } = this.props;
    if (proof && proof.proofs[0]) {
      const proofDoc = proof.proofs[0];
      this.setState({ file });
      this.setState({ proof: proofDoc });
      window.addEventListener('resize', this._updateDimensions.bind(this));
    }
  }

  componentDidUpdate() {
    const { size, diagramCreated } = this.state;
    // $FlowFixMe
    const height = document.getElementById('diagramContainer').clientHeight;
    // $FlowFixMe
    const width = document.getElementById('diagramContainer').clientWidth;
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
      if (width > 415) {
        size.width = 415;
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
  _createDiagram() {
    const {
      diagramData, size, selector, proof,
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
      .attr('viewBox', '-50 -840 500 500')
      .attr('transform', 'rotate(90)');

    this.state.center = root.x;
    this.setState({ center: root.x });

    // Link to part 2
    d3.select(selector)
      .select('svg.selector')
      .append('line')
      .classed('rowLink1', true)
      .attr('stroke-dasharray', 4)
      .attr('x1', root.x)
      .attr('y1', root.y)
      .attr('x2', root.x)
      .attr('y2', root.y - 350);

    // Link to part 3
    d3.select(selector)
      .select('svg.selector')
      .append('line')
      .classed('rowLink2', true)
      .classed('hide', proof.status === PROOF_STATUS.PENDING)
      .attr('stroke-dasharray', 4)
      .attr('x1', root.x)
      .attr('y1', root.y)
      .attr('x2', root.x)
      .attr('y2', root.y - 350);
    d3.select(selector)
      .select('svg.selector')
      .append('line')
      .classed('rowLink2', true)
      .classed('hide', proof.status === PROOF_STATUS.PENDING)
      .attr('stroke-dasharray', 4)
      .attr('x1', root.x)
      .attr('y1', root.y - 350)
      .attr('x2', root.x - 140)
      .attr('y2', root.y - 350);
    d3.select(selector)
      .select('svg.selector')
      .append('line')
      .classed('rowLink2', true)
      .classed('hide', proof.status === PROOF_STATUS.PENDING)
      .attr('stroke-dasharray', 4)
      .attr('x1', root.x - 140)
      .attr('y1', root.y - 350)
      .attr('x2', root.x - 140)
      .attr('y2', root.y - 600);

    // Link to part 4
    d3.select(selector)
      .select('svg.selector')
      .append('line')
      .classed('rowLink3', true)
      .classed('hide', proof.status !== PROOF_STATUS.VALID)
      .attr('stroke-dasharray', 4)
      .attr('x1', root.x)
      .attr('y1', root.y - 800)
      .attr('x2', root.x)
      .attr('y2', root.y - 1150);

    // PART 1
    d3.select(selector)
      .select('svg.selector')
      .selectAll('line.linkH1')
      .data(root.links())
      .enter()
      .append('line')
      .classed('linkH1', true)
      .attr('x1', data => data.source.x)
      .attr('y1', data => data.source.y)
      .attr('x2', data => data.target.x)
      .attr('y2', data => data.source.y);
    d3.select(selector)
      .select('svg.selector')
      .selectAll('line.linkV1')
      .data(root.links())
      .enter()
      .append('line')
      .classed('linkV1', true)
      .attr('x1', data => data.target.x)
      .attr('y1', data => data.source.y)
      .attr('x2', data => data.target.x)
      .attr('y2', data => data.target.y);
    d3.select(selector)
      .select('svg')
      .selectAll('circle.node1')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('node1', true)
      .attr('class', data => `${data.data.color}Stroke`)
      .attr('cx', data => data.x)
      .attr('cy', data => data.y)
      .attr('r', 20);
    d3.select(selector)
      .select('svg.selector')
      .selectAll('circle.nodeInner1')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('nodeInner1', true)
      .classed('hide', proof.status === PROOF_STATUS.PENDING)
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

    // PART 2
    d3.select(selector)
      .select('svg')
      .append('circle')
      .classed('node2', true)
      .attr('class', 'blueStroke')
      .attr('cx', root.x)
      .attr('cy', root.y - 350)
      .attr('r', 20);
    d3.select(selector)
      .select('svg.selector')
      .append('circle')
      .classed('nodeInner2', true)
      .classed('hide', proof.status === PROOF_STATUS.PENDING)
      .attr('class', 'blueNode')
      .attr('cx', root.x)
      .attr('cy', root.y - 350)
      .attr('r', 16)
      .on('mouseover', () => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html('Your Root Hash.')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });

    // PART 3
    d3.select(selector)
      .select('svg.selector')
      .selectAll('line.linkH3')
      .data(root.links())
      .enter()
      .append('line')
      .classed('linkH3', true)
      .attr('x1', data => data.source.x)
      .attr('y1', data => data.source.y - 800)
      .attr('x2', data => data.target.x)
      .attr('y2', data => data.source.y - 800);
    d3.select(selector)
      .select('svg.selector')
      .selectAll('line.linkV3')
      .data(root.links())
      .enter()
      .append('line')
      .classed('linkV3', true)
      .attr('x1', data => data.target.x)
      .attr('y1', data => data.source.y - 800)
      .attr('x2', data => data.target.x)
      .attr('y2', data => data.target.y - 800);
    d3.select(selector)
      .select('svg')
      .selectAll('circle.node3')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('node3', true)
      .attr('class', data => `${data.data.color}Stroke`)
      .attr('cx', data => data.x)
      .attr('cy', data => data.y - 800)
      .attr('r', 20);
    d3.select(selector)
      .select('svg.selector')
      .selectAll('circle.nodeInner3')
      .data(root.descendants())
      .enter()
      .append('circle')
      .classed('nodeInner3', true)
      .classed('hide', proof.status === PROOF_STATUS.PENDING)
      .attr(
        'class',
        data => `${data.data.color}Node hidden_${(proof.status === PROOF_STATUS.PENDING).toString()}`,
      )
      .attr('cx', data => data.x)
      .attr('cy', data => data.y - 800)
      .attr('r', 16)
      .on('mouseover', (d) => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html(d.data.tooltip === 'Your Document' ? 'Root Hash' : d.data.tooltip)
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });

    // PART 4
    d3.select(selector)
      .select('svg')
      .append('circle')
      .classed('node4', true)
      .attr('class', 'blueStroke')
      .attr('cx', root.x)
      .attr('cy', root.y - 1150)
      .attr('r', 20);
    d3.select(selector)
      .select('svg.selector')
      .append('circle')
      .classed('nodeInner4', true)
      .attr('class', `blueNode hidden_${(proof.status === PROOF_STATUS.PENDING).toString()}`)
      .attr('cx', root.x)
      .attr('cy', root.y - 1150)
      .attr('r', 16)
      .on('mouseover', () => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html('Your Bitcoin Block')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });

    d3.select(selector)
      .select('svg')
      .append('circle')
      .classed('node4', true)
      .attr('class', 'whiteStroke')
      .attr('cx', root.x + 50)
      .attr('cy', root.y - 1150)
      .attr('r', 20);
    d3.select(selector)
      .select('svg.selector')
      .append('circle')
      .classed('nodeInner4', true)
      .classed('hide', proof.status === PROOF_STATUS.PENDING)
      .attr('class', `whiteNode hidden_${(proof.status === PROOF_STATUS.PENDING).toString()}`)
      .attr('cx', root.x + 50)
      .attr('cy', root.y - 1150)
      .attr('r', 16)
      .on('mouseover', () => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html('Another Bitcoin Block')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });
    d3.select(selector)
      .select('svg')
      .append('circle')
      .classed('node4', true)
      .attr('class', 'whiteStroke')
      .attr('cx', root.x + 100)
      .attr('cy', root.y - 1150)
      .attr('r', 20);
    d3.select(selector)
      .select('svg.selector')
      .append('circle')
      .classed('nodeInner4', true)
      .classed('hide', proof.status === PROOF_STATUS.PENDING)
      .attr('class', `whiteNode hidden_${(proof.status === PROOF_STATUS.PENDING).toString()}`)
      .attr('cx', root.x + 100)
      .attr('cy', root.y - 1150)
      .attr('r', 16)
      .on('mouseover', () => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html('Another Bitcoin Block')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });
    d3.select(selector)
      .select('svg')
      .append('circle')
      .classed('node4', true)
      .attr('class', 'whiteStroke')
      .attr('cx', root.x - 50)
      .attr('cy', root.y - 1150)
      .attr('r', 20);
    d3.select(selector)
      .select('svg.selector')
      .append('circle')
      .classed('nodeInner4', true)
      .classed('hide', proof.status === PROOF_STATUS.PENDING)
      .attr('class', `whiteNode hidden_${(proof.status === PROOF_STATUS.PENDING).toString()}`)
      .attr('cx', root.x - 50)
      .attr('cy', root.y - 1150)
      .attr('r', 16)
      .on('mouseover', () => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html('Another Bitcoin Block')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });
    d3.select(selector)
      .select('svg')
      .append('circle')
      .classed('node4', true)
      .attr('class', 'whiteStroke')
      .attr('cx', root.x - 100)
      .attr('cy', root.y - 1150)
      .attr('r', 20);
    d3.select(selector)
      .select('svg.selector')
      .append('circle')
      .classed('nodeInner4', true)
      .classed('hide', proof.status === PROOF_STATUS.PENDING)
      .attr('class', `whiteNode hidden_${(proof.status === PROOF_STATUS.PENDING).toString()}`)
      .attr('cx', root.x - 100)
      .attr('cy', root.y - 1150)
      .attr('r', 16)
      .on('mouseover', () => {
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html('Another Bitcoin Block')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      });

    this.setState({ diagramCreated: true });
  }

  render() {
    const { proof, file } = this.state;

    if (!proof || proof === {}) {
      return (
        <div className="proofDiagramWrapper">
          <Loading isFullScreen={false} message="Fetching Proof Information..." />
        </div>
      );
    }

    let fileType = 'UNKNOWN';
    if (file && file.name) {
      fileType = file.name.split('.');
      fileType = fileType[fileType.length - 1];
    }

    return (
      <div className="proofDiagramWrapper">
        <div className="rowOne row">
          <div className="columnOne column">
            <b>Step 1</b>
: Database
          </div>
          <div className="columnTwo column">
            <b>Step 2</b>
: Hash
          </div>
          <div className="columnThree column">
            <b>Step 3</b>
: Chainpoint
          </div>
          <div className="columnFour column">
            <b>Step 4</b>
: Blockchain
          </div>
        </div>
        <div
          // eslint-disable-next-line no-return-assign
          ref={selector => (this.state.selector = selector)}
          id="diagramContainer"
          className="rowTwo row"
        />
        <div className="rowThree row">
          <TickIcon className="tickIcon first" />
          <div className="hr hrOne" />
          <TickIcon className="tickIcon second" />
          <div className="hr hrTwo" />
          {proof && proof.status && proof.status === PROOF_STATUS.PENDING ? (
            <PendingIcon className="pendingIcon third" />
          ) : (
            <TickIcon className="tickIcon third" />
          )}
          {proof && proof.status && proof.status === PROOF_STATUS.VALID ? (
            <div className="hr hrThree" />
          ) : (
            <div className="hr hrThree hrHide" />
          )}
          {proof
          && proof.status
          && (proof.status === PROOF_STATUS.PENDING || proof.status === PROOF_STATUS.SUBMITTED) ? (
            <PendingIcon className="pendingIcon fourth" />
            ) : (
              <TickIcon className="tickIcon fourth" />
            )}
        </div>
        <div className="rowFour row">
          <div className="columnOne column">
            <div className="cardArrow" />
            <div className="card cardOne">
              <div className="cardRow">
                <div className="cardIcon">
                  <HashCollectionIcon />
                </div>
                <div className="cardInfo">
                  <div className="cardTitle">File Proven</div>
                  <div className="cardValue">
                    <Tooltip
                      content={file && file.name}
                      position={Position.RIGHT}
                      usePortal={false}
                    >
                      <div className="cardValue overflow">
                        {file && file.name && file.name.length > 7
                          ? `${file.name.substring(0, 7)}...`
                          : (file && file.name) || ''}
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </div>
              <div className="cardRow">
                <div className="cardIcon">
                  <DocumentsIcon />
                </div>
                <div className="cardInfo">
                  <div className="cardTitle">Document Type</div>
                  <div className="cardValue">{`.${fileType}`}</div>
                </div>
              </div>
              <div className="cardRow finalRow">
                <div className="cardIcon">
                  <StackIcon />
                </div>
                <div className="cardInfo">
                  <div className="cardTitle">Version</div>
                  <div className="cardValue">{proof && proof.version ? proof.version : null}</div>
                </div>
              </div>
              <div className="infoRow">
                <div className="infoButton">
                  <Tooltip
                    content="Many different documents and collections are combined into a root hash."
                    position={Position.RIGHT}
                  >
                    <InfoIcon className="infoIcon" />
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
          <div className="columnTwo column">
            <div className="cardArrow" />
            <div className="card cardOne">
              <div className="cardRow">
                <div className="cardIcon">
                  <KeyIcon />
                </div>
                <div className="cardInfo">
                  <div className="cardTitle ">Document Hash</div>
                  <div className="cardValue hash">
                    {proof && proof.documentHash ? proof.documentHash : 'UNKNOWN'}
                  </div>
                </div>
              </div>
              <div className="infoRow">
                <div className="infoButton">
                  <Tooltip
                    content="This hash is the combination of all the documents in the database."
                    position={Position.RIGHT}
                  >
                    <InfoIcon className="infoIcon" />
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
          <div className="columnThree column">
            {proof && proof.status && proof.status !== PROOF_STATUS.PENDING && (
              <div>
                <div className="cardArrow" />
                <div className="card cardOne">
                  <div className="cardRow">
                    <div className="cardIcon">
                      <ChainIcon />
                    </div>
                    <div className="cardInfo">
                      <div className="cardTitle">Chainpoint Hash</div>
                      <div className="cardValue hash">
                        {proof && proof.versionHash ? proof.versionHash : 'UNKNOWN'}
                      </div>
                    </div>
                  </div>
                  <div className="infoRow">
                    <div className="infoButton">
                      <Tooltip
                        content="Chainpoint bundles together many hashes along with your Database hash to create a single new Merkel Tree."
                        position={Position.RIGHT}
                      >
                        <InfoIcon className="infoIcon" />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="columnFour column">
            {proof && proof.status && proof.status === PROOF_STATUS.VALID && (
              <div>
                <div className="cardArrow" />
                <div className="card cardOne">
                  <div className="cardRow">
                    <div className="cardIcon">
                      <BitcoinIcon />
                    </div>
                    <div className="cardInfo">
                      <div className="cardTitle">Block Number</div>
                      <div className="cardValue overflow">
                        {proof ? proof.btcBlockNumber : 'UNKNOWN'}
                      </div>
                    </div>
                  </div>
                  <div className="cardRow">
                    <div className="cardIcon">
                      <TransactionIcon />
                    </div>
                    <div className="cardInfo">
                      <div className="cardTitle">Transaction ID</div>
                      <Tooltip
                        content={proof && proof.btcTransaction}
                        position={Position.LEFT}
                        usePortal={false}
                      >
                        <div className="cardValue overflow">
                          {proof && proof.btcTransaction
                            ? `${proof.btcTransaction.substring(0, 7)}...`
                            : 'UNKNOWN'}
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="cardRow blockLink">
                    <div className="cardInfo">
                      <div className="cardTitle">Link to block explorer:</div>
                      <div className="cardValue overflow">
                        <Button
                          className="blueButton blockLink"
                          onClick={() => {
                            window.open(
                              `https://live.blockcypher.com/btc/tx/${proof.btcTransaction}/`,
                            );
                          }}
                        >
                          {' '}
                          Click here
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="infoRow">
                    <div className="infoButton">
                      <Tooltip
                        content="This block in the bitcoin blockchain proves your document!"
                        position={Position.RIGHT}
                      >
                        <InfoIcon className="infoIcon" />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
