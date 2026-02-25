import { css } from '@emotion/css';
import { isString } from 'lodash';
import { FeatureLike } from 'ol/Feature';
import { useState } from 'react';
import * as React from 'react';

import { DataFrame, FieldType, getFieldDisplayName, GrafanaTheme2 } from '@grafana/data';
import { Collapse, TabContent, useStyles2 } from '@grafana/ui';
import { GeomapLayerHover } from 'app/plugins/panel/geomap/event';

import { DataHoverRow } from './DataHoverRow';

type Props = {
  layers: GeomapLayerHover[];
  activeTabIndex: number;
  onClose?: () => void;
};

export const DataHoverRows = ({ layers, activeTabIndex, onClose }: Props) => {
  const styles = useStyles2(getStyles);
  const [rowMap, setRowMap] = useState(new Map<string | number, boolean>());

  const updateRowMap = (key: string | number, value: boolean) => {
    setRowMap(new Map(rowMap.set(key, value)));
  };

  return (
    <TabContent>
      {layers.map(
        (geomapLayer, index) =>
          index === activeTabIndex && (
            <div key={geomapLayer.layer.getName()}>
              <div>
                {geomapLayer.features.map((feature, idx) => {
                  const key = feature.getId() ?? idx;
                  const shouldDisplayCollapse = geomapLayer.features.length > 1;

                  return shouldDisplayCollapse ? (
                    <Collapse
                      key={key}
                      collapsible
                      label={generateLabel(feature, idx)}
                      isOpen={rowMap.get(key)}
                      onToggle={() => {
                        updateRowMap(key, !rowMap.get(key));
                      }}
                      className={styles.collapsibleRow}
                    >
                      <DataHoverRow feature={feature} onClose={onClose} />
                    </Collapse>
                  ) : (
                    <DataHoverRow key={key} feature={feature} onClose={onClose} />
                  );
                })}
              </div>
            </div>
          )
      )}
    </TabContent>
  );
};

/**
 * Generates a label for a feature in the site selector
 * Prioritizes: Station Name > Name > Title > ID > First string field
 * Returns just the value (not "Field: Value" format) for cleaner display
 */
export const generateLabel = (feature: FeatureLike, idx: number): string | React.ReactNode => {
  // Priority order for finding a good label
  const nameFields = [
    'Station Name', 'StationName', 'station_name',
    'Site Name', 'SiteName', 'site_name',
    'Name', 'name',
    'Title', 'title',
    'Location', 'location',
    'ID', 'id'
  ];
  
  let props = feature.getProperties();
  let firstStringField: { key: string; value: string } | null = null;
  
  const frame = feature.get('frame') as DataFrame;
  if (frame) {
    const rowIndex = feature.get('rowIndex');
    for (const f of frame.fields) {
      if (f.type === FieldType.string) {
        const k = getFieldDisplayName(f, frame);
        const value = f.values[rowIndex];
        if (value && String(value).trim()) {
          props[k] = value;
          // Track first valid string field
          if (!firstStringField) {
            firstStringField = { key: k, value: String(value) };
          }
        }
      }
    }
  }

  // Try to find a name field
  for (let k of nameFields) {
    const v = props[k];
    if (v && String(v).trim()) {
      return String(v);
    }
  }

  // Fallback to first string field value (just the value, not key: value)
  if (firstStringField) {
    return firstStringField.value;
  }

  // Last resort: try any string property
  for (let k of Object.keys(props)) {
    const v = props[k];
    if (isString(v) && v.trim()) {
      return v;
    }
  }

  return `Site ${idx + 1}`;
};

const getStyles = (theme: GrafanaTheme2) => ({
  collapsibleRow: css({
    marginBottom: 0,
  }),
});
