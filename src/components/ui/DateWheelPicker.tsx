import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const ITEM_H = 50;
const VISIBLE = 5;
const PAD = 2; // Math.floor(VISIBLE / 2)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate(); // month is 1-based
}

interface WheelProps {
  items: (string | number)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function WheelColumn({ items, selectedIndex, onSelect }: WheelProps) {
  const listRef = useRef<FlatList>(null);
  const mounted = useRef(false);
  // While true, the useEffect must NOT call scrollToOffset — the user's scroll
  // (or its momentum animation) still owns the position. Calling scrollToOffset
  // here is what causes the "scrolls back" behaviour.
  const userScrolling = useRef(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollTo = (index: number, animated: boolean) => {
    listRef.current?.scrollToOffset({ offset: index * ITEM_H, animated });
  };

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // Initial position — delay so FlatList has finished layout
      setTimeout(() => scrollTo(selectedIndex, false), 80);
      return;
    }
    // Only scroll programmatically when the change originates from the parent
    // (e.g. day clamped after month change), not from the user dragging this column
    if (!userScrolling.current) {
      scrollTo(selectedIndex, true);
    }
  }, [selectedIndex]);

  const onScrollBegin = () => {
    userScrolling.current = true;
    if (clearTimer.current) clearTimeout(clearTimer.current);
  };

  const onScrollEnd = (e: any) => {
    const raw = e.nativeEvent.contentOffset.y / ITEM_H;
    const index = Math.max(0, Math.min(Math.round(raw), items.length - 1));
    onSelect(index);
    // Keep the flag set long enough for the snap animation to finish before
    // the useEffect is allowed to call scrollToOffset again
    clearTimer.current = setTimeout(() => {
      userScrolling.current = false;
    }, 350);
  };

  return (
    <FlatList
      ref={listRef}
      data={items}
      keyExtractor={(_, i) => String(i)}
      style={{ flex: 1, height: ITEM_H * VISIBLE }}
      contentContainerStyle={{ paddingVertical: ITEM_H * PAD }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      // 0.92 decelerates much faster than the default "fast" (≈0.99)
      // so a quick flick travels 2-4 items instead of 10+
      decelerationRate={0.92}
      getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * PAD + i * ITEM_H, index: i })}
      onScrollBeginDrag={onScrollBegin}
      onMomentumScrollBegin={onScrollBegin}
      onMomentumScrollEnd={onScrollEnd}
      onScrollEndDrag={onScrollEnd}
      nestedScrollEnabled
      renderItem={({ item, index }) => {
        const selected = index === selectedIndex;
        const near = Math.abs(index - selectedIndex) === 1;
        const label =
          typeof item === 'number' && item < 10 ? `0${item}` : String(item);
        return (
          <View style={styles.item}>
            <Text
              style={[
                styles.itemText,
                near && styles.itemNear,
                selected && styles.itemSelected,
              ]}
            >
              {label}
            </Text>
          </View>
        );
      }}
    />
  );
}

export interface DateWheelPickerProps {
  day: number;
  month: number; // 1–12
  year: number;
  onChange: (day: number, month: number, year: number) => void;
  minYear?: number;
  maxYear?: number;
}

export function DateWheelPicker({
  day,
  month,
  year,
  onChange,
  minYear = 1940,
  maxYear = new Date().getFullYear() - 5,
}: DateWheelPickerProps) {
  const totalYears = maxYear - minYear + 1;
  const years = Array.from({ length: totalYears }, (_, i) => minYear + i);
  const daysInMonth = getDaysInMonth(month, year);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const dayIdx = Math.max(0, Math.min(day - 1, daysInMonth - 1));
  const monthIdx = month - 1;
  const yearIdx = Math.max(0, Math.min(year - minYear, totalYears - 1));

  return (
    <View style={styles.container}>
      <View style={styles.selector} pointerEvents="none" />

      <WheelColumn
        items={days}
        selectedIndex={dayIdx}
        onSelect={(i) => onChange(i + 1, month, year)}
      />
      <WheelColumn
        items={MONTHS}
        selectedIndex={monthIdx}
        onSelect={(i) => {
          const nm = i + 1;
          onChange(Math.min(day, getDaysInMonth(nm, year)), nm, year);
        }}
      />
      <WheelColumn
        items={years}
        selectedIndex={yearIdx}
        onSelect={(i) => {
          const ny = minYear + i;
          onChange(Math.min(day, getDaysInMonth(month, ny)), month, ny);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: ITEM_H * VISIBLE,
    overflow: 'hidden',
  },
  selector: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: ITEM_H * PAD,
    height: ITEM_H,
    backgroundColor: Colors.surface2,
    borderRadius: 10,
  },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 15, color: Colors.textMuted, fontWeight: '400', opacity: 0.4 },
  itemNear: { fontSize: 17, opacity: 0.65 },
  itemSelected: { fontSize: 20, color: Colors.text, fontWeight: '700', opacity: 1 },
});
