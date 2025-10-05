import React from 'react';
import { useParams } from 'react-router-dom';
import TaskSubmissions from './TaskSubmissions';

const TaskSubmissionsRoute: React.FC = () => {
    const params = useParams();
    const taskId = Number(params.taskId);
    if (!taskId) return <div className="p-4 text-red-600">Thiếu taskId hợp lệ</div>;
    return <TaskSubmissions taskId={taskId} />;
};

export default TaskSubmissionsRoute;


