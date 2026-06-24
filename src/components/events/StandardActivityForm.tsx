import React from 'react';
import EventForm from './EventForm';
import { StandardActivityCreateRequest } from '../../types/activity';

interface StandardActivityFormProps {
    onSubmit: (data: StandardActivityCreateRequest) => void;
    loading?: boolean;
    initialData?: Partial<StandardActivityCreateRequest>;
    title?: string;
    onCancel?: () => void;
}

const StandardActivityForm: React.FC<StandardActivityFormProps> = (props) => {
    // StandardActivityForm is a thin wrapper over EventForm that enforces
    // the StandardActivityCreateRequest type at the API contract level.
    // EventForm already contains all standard activity logic (presets, score rules,
    // date validation, etc.). Since StandardActivityCreateRequest and
    // CreateActivityRequest are structurally identical, we pass through directly.
    return <EventForm {...props} />;
};

export default StandardActivityForm;
