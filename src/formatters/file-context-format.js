    

export class FileContextFormatValueConverter {
  
    toView(fileMeta, format) {
        if (fileMeta.context === 'courseInstance') {
            let info = null;
            if (fileMeta.courseInstanceRef) {
                info = fileMeta.courseInstanceRef.name;
            }
            /*
            if (fileMeta.submissionRef) {
                if (info === null) {
                    info += fileMeta.submissionRef.name;    
                } else {
                    info += ' - ' + fileMeta.submissionRef.name;
                }
            }
            */
            if (fileMeta.submissionResult) {
                if (fileMeta.submissionResult.result === 'passed') {
                    info += ' (Passed)';
                } else {
                    info += ' (Failed)';
                }
            } else {
                info += ' (Not marked)';
            }
            if (info) {
                return info;
            }
            return 'Course';
        }
        return 'NA';
    }
}

  