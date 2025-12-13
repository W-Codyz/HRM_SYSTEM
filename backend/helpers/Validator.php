<?php
/**
 * Validation Helper
 * Input validation utilities
 */

class Validator {
    
    public static function required($value, $fieldName) {
        if (empty($value) && $value !== '0' && $value !== 0) {
            return "$fieldName is required";
        }
        return null;
    }

    public static function email($value, $fieldName = 'Email') {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return "$fieldName must be a valid email address";
        }
        return null;
    }

    public static function minLength($value, $min, $fieldName) {
        if (strlen($value) < $min) {
            return "$fieldName must be at least $min characters";
        }
        return null;
    }

    public static function maxLength($value, $max, $fieldName) {
        if (strlen($value) > $max) {
            return "$fieldName must not exceed $max characters";
        }
        return null;
    }

    public static function numeric($value, $fieldName) {
        if (!is_numeric($value)) {
            return "$fieldName must be a number";
        }
        return null;
    }

    public static function date($value, $fieldName = 'Date') {
        $d = DateTime::createFromFormat('Y-m-d', $value);
        if (!$d || $d->format('Y-m-d') !== $value) {
            return "$fieldName must be a valid date (Y-m-d)";
        }
        return null;
    }

    public static function inArray($value, $allowed, $fieldName) {
        if (!in_array($value, $allowed)) {
            return "$fieldName must be one of: " . implode(', ', $allowed);
        }
        return null;
    }

    public static function validate($rules) {
        $errors = [];
        
        foreach ($rules as $field => $fieldRules) {
            foreach ($fieldRules as $rule => $params) {
                $value = $params['value'] ?? null;
                $fieldName = $params['name'] ?? $field;
                
                $error = null;
                switch ($rule) {
                    case 'required':
                        $error = self::required($value, $fieldName);
                        break;
                    case 'email':
                        $error = self::email($value, $fieldName);
                        break;
                    case 'min':
                        $error = self::minLength($value, $params['length'], $fieldName);
                        break;
                    case 'max':
                        $error = self::maxLength($value, $params['length'], $fieldName);
                        break;
                    case 'numeric':
                        $error = self::numeric($value, $fieldName);
                        break;
                    case 'date':
                        $error = self::date($value, $fieldName);
                        break;
                    case 'in':
                        $error = self::inArray($value, $params['values'], $fieldName);
                        break;
                }
                
                if ($error) {
                    if (!isset($errors[$field])) {
                        $errors[$field] = [];
                    }
                    $errors[$field][] = $error;
                }
            }
        }
        
        return $errors;
    }
}
