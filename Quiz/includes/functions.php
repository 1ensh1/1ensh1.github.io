<?php
function getSubjects() {
    global $conn;
    $result = $conn->query("SELECT * FROM subjects ORDER BY name");
    return $result->fetch_all(MYSQLI_ASSOC);
}

function getSubjectById($id) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM subjects WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function getFormativesBySubject($subject_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM formatives WHERE subject_id = ? ORDER BY number");
    $stmt->bind_param("i", $subject_id);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function getFormative($subject_id, $formative_num) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM formatives WHERE subject_id = ? AND number = ?");
    $stmt->bind_param("ii", $subject_id, $formative_num);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function getQuestions($subject_id, $formative_num) {
    $filename = "data/subject_{$subject_id}_formative_{$formative_num}.txt";
    
    if (!file_exists($filename)) {
        return [];
    }
    
    $content = file_get_contents($filename);
    $questions = unserialize($content);
    
    return is_array($questions) ? $questions : [];
}

function saveQuestions($subject_id, $formative_num, $questions) {
    $filename = "data/subject_{$subject_id}_formative_{$formative_num}.txt";
    $content = serialize($questions);
    file_put_contents($filename, $content);
}

function countAllQuestions() {
    $count = 0;
    $files = glob('data/subject_*_formative_*.txt');
    
    foreach ($files as $file) {
        $content = file_get_contents($file);
        $questions = unserialize($content);
        $count += count($questions);
    }
    
    return $count;
}
?>