/* @flow
 * @Author: Michael Harrison
 * @Date:   2019-03-18T12:47:17+11:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2019-03-25T15:56:06+11:00
 */

import React from 'react';
import autobind from 'autobind-decorator';
import { Select } from 'antd';
import ReactDataSheet from 'react-datasheet';
import _ from 'lodash';
import { Error, Loading } from '../Common';
// $FlowFixMe
import './react-datasheet.scss';
// $FlowFixMe
import './ExcelPreview.scss';

const { Option } = Select;
const MAX_ROWS = 85;
const MAX_COLUMNS = 85;

type Props = {
  excelData: Object;
};
type State = {
  isLoading: boolean;
  sheetSelected: number;
  sheetNames: any;
  sheetGrids: any;
  size: any;
  parsedExcelData: any;
  error: string | null;
  size: { width: 400; height: 200 };
};

export default class ExcelPreview extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: true,
      parsedExcelData: [],
      sheetSelected: 0,
      size: { width: 400, height: 200 },
      sheetGrids: [[]],
      sheetNames: [],
      error: null,
    };
  }

  componentWillReceiveProps(props: Object) {
    const { excelData } = props;
    this._parseExcelData(excelData);
  }

  componentDidUpdate() {
    const { size } = this.state;
    if (document && document.getElementById('lowerGroup')) {
      // $FlowFixMe
      const height: number = document.getElementById('lowerGroup').clientHeight;
      // $FlowFixMe
      const width: number = document.getElementById('lowerGroup').clientWidth;
      size.height = height;
      size.width = width;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._updateDimensions);
  }

  @autobind
  _parseExcelData(excelData: Object) {
    const { SheetNames, Sheets } = excelData;
    const { parsedExcelData, sheetGrids } = this.state;
    if (SheetNames) {
      // For each sheet in sheet names:
      for (let i = 0, len = SheetNames.length; i < len; i += 1) {
        // Get the sheet information from the object.
        const sheetData = Sheets[SheetNames[i]];
        const sheetDataArray: any = Object.entries(sheetData);
        const gridData: any = [];
        for (let index = 0, l = sheetDataArray.length; index < l; index += 1) {
          // Analyse the entry for column letter.

          const location: any = sheetDataArray[index][0].match(/([A-Za-z]+)([0-9]+)/);
          if (location && location[1]) {
            let column = location[1];
            const row = location[2];
            const value = sheetDataArray[index][1].v;
            column = this.letterToNumber(column.toLowerCase());
            if (column < MAX_COLUMNS && row < MAX_ROWS) {
              if (column >= 0) {
                if (gridData[row]) {
                  gridData[row][column] = { value };
                } else {
                  gridData[row] = [];
                  gridData[row][column] = { value };
                }
              }
            }
          }
        }
        // Fill empty entries in grid.
        for (let row = 0, rowLength = gridData.length; row < rowLength; row += 1) {
          if (gridData[row]) {
            for (
              let column = 0, columnLength = gridData[row].length;
              column < columnLength;
              column += 1
            ) {
              if (!gridData[row][column]) {
                gridData[row][column] = { value: '' };
              }
            }
          } else {
            gridData[row] = [];
            gridData[row][0] = { value: '' };
          }
        }

        parsedExcelData.push({ name: SheetNames[i], gridData });
        sheetGrids[i] = gridData;
      }
      this.setState({ isLoading: false });
      this.setState({ sheetNames: excelData.SheetNames });
    }
  }

  @autobind
  _updateDimensions() {
    const newSize: Object = {};
    // $FlowFixMe
    const height = document.getElementById('lowerGroup').clientHeight;
    // $FlowFixMe
    let width = document.getElementById('lowerGroup').clientWidth;
    if (width <= 1200) {
      width = 1200;
    }
    newSize.height = height;
    newSize.width = width;
    this.setState({ size: newSize });
  }

  @autobind
  // eslint-disable-next-line
  letterToNumber(letter: string) {
    // @TODO -> Handling for AA - ZZ
    if (letter.length > 1) {
      return -1;
    }
    const charCode = letter.charCodeAt(0) - 97;
    return charCode;
  }

  @autobind
  _selectedSheetHandlechange(value: string) {
    const { sheetNames } = this.state;
    const selectIndex = _.findIndex(sheetNames, name => name.toLowerCase() === value.toLowerCase());
    this.setState({ sheetSelected: selectIndex });
  }

  render() {
    const sheetOptions = [];
    const {
      sheetSelected, sheetNames, error, isLoading, sheetGrids,
    } = this.state;
    const currentSheet = sheetGrids[sheetSelected];

    if (error) {
      return (
        <Error isFullScreen={false} title="Sorry!" message="Failed to create Excel Preview." />
      );
    }
    if (isLoading) {
      return <Loading isFullScreen={false} message="Fetching Document Preview..." />;
    }
    if (sheetSelected < 0) {
      return <span> Please select a sheet.</span>;
    }

    sheetNames.forEach(sheetName => sheetOptions.push(<Option value={sheetName.toLowerCase()}>{sheetName}</Option>));
    return (
      <div className="excelPreviewWrapper">
        <div className="excelPreviewControls">
          <Select
            showSearch
            className="selectSheet"
            placeholder="Select A Sheet"
            defaultValue={sheetNames[0].toLowerCase()}
            value={sheetNames[sheetSelected].toLowerCase()}
            optionFilterProp="children"
            onChange={this._selectedSheetHandlechange}
            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {sheetOptions}
          </Select>
          <div className="sheetButtons">
            <div
              className="sheetButton prevSheetButton"
              onClick={() => {
                if (sheetSelected > 0) {
                  this.setState({ sheetSelected: sheetSelected - 1 });
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="sheetLabel">{'<'}</div>
            </div>
            <div
              className="sheetButton nextSheetButton"
              onClick={() => {
                if (sheetSelected < sheetNames.length - 1) {
                  this.setState({ sheetSelected: sheetSelected + 1 });
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="sheetLabel">{'>'}</div>
            </div>
          </div>
        </div>
        <div className="excelPreviewData">
          <ReactDataSheet
            data={currentSheet}
            valueRenderer={cell => cell.value || ''}
            onCellsChanged={() => {
              // eslint-disable-next-line
              //const grid = currentSheet.map(row => [...row]);
              /* changes.forEach(({ // eslint-disable-next-line
                cell, row, col, value }) => {
                grid[row][col] = { ...grid[row][col], value };
              }); */
              // @TODO -> Handle update?
              // this.state.sheetGrids[sheetSelected] = grid;
              // this.forceUpdate();
            }}
          />
        </div>
      </div>
    );
  }
}
