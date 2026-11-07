export type TargetDatesMap = Record<string, Date>;

export interface SubjectPickerProps {
  subject: string;
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  maxDate: Date;
}

