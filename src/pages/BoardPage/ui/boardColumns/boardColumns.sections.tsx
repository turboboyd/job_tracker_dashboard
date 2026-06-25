import { DragOverlay } from '@dnd-kit/core';
import React from 'react';

import type { BoardCardItem, BoardVM } from '../../model/types';
import { BoardColumn } from '../BoardColumn';
import { BoardMatchCardOverlay } from '../BoardMatchCard';

import type { BoardStatusView } from './boardColumns.helpers';
import type { ColumnsState } from './columnsState';

type BoardColumnsScrollerProps = Readonly<{
  activeId: string | null;
  boardScrollRef: (node: HTMLDivElement | null) => void;
  statuses: readonly BoardStatusView[];
  columnsState: ColumnsState;
  loopIdToName: BoardVM['data']['loopIdToName'];
  busy: boolean;
  onDelete: BoardVM['actions']['onDelete'];
}>;

export function BoardColumnsScroller({
  activeId,
  boardScrollRef,
  statuses,
  columnsState,
  loopIdToName,
  busy,
  onDelete,
}: BoardColumnsScrollerProps) {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <div
        ref={boardScrollRef}
        data-board-columns-scroll="1"
        className={[
          'h-full min-h-0',
          'overflow-x-auto overflow-y-hidden',
          activeId ? 'touch-none' : 'touch-pan-x',
          'overscroll-x-contain',
          'no-scrollbar',
        ].join(' ')}
      >
        <div
          className={[
            'h-full min-h-0 flex items-stretch gap-md',
            'min-w-max',
            'px-md pb-md safe-px safe-pb',
            !activeId ? 'snap-x snap-mandatory' : '',
          ].join(' ')}
        >
          {statuses.map(({ status, title }) => {
            const items = columnsState.get(status) ?? [];
            return (
              <div key={status} className="h-full snap-start">
                <BoardColumn
                  status={status}
                  title={title}
                  items={items}
                  loopIdToName={loopIdToName}
                  busy={busy}
                  onArchive={onDelete}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type BoardColumnsOverlayProps = Readonly<{
  activeMatch: BoardCardItem | null;
  activeLoopName: string;
  busy: boolean;
  onDelete: BoardVM['actions']['onDelete'];
}>;

export function BoardColumnsOverlay({
  activeMatch,
  activeLoopName,
  busy,
  onDelete,
}: BoardColumnsOverlayProps) {
  return (
    <DragOverlay adjustScale={false}>
      {activeMatch ? (
        <div className="pointer-events-none w-[min(92vw,340px)]">
          <BoardMatchCardOverlay
            item={activeMatch}
            loopName={activeLoopName}
            busy={busy}
            onArchive={onDelete}
          />
        </div>
      ) : null}
    </DragOverlay>
  );
}
