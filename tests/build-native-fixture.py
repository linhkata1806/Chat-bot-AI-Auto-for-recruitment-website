from pathlib import Path
line = 'SYNTHETIC TEST PROFILE. Candidate has experience in Java and Spring.'
commands = ['BT /F1 12 Tf']
for index in range(4):
    commands.append(('50 760 Td' if index == 0 else '0 -18 Td') + f' ({line}) Tj')
commands.append('ET')
stream = '\n'.join(commands).encode('ascii')
objects = [b'<< /Type /Catalog /Pages 2 0 R >>', b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>', b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', b'<< /Length ' + str(len(stream)).encode() + b' >>\nstream\n' + stream + b'\nendstream']
out = bytearray(b'%PDF-1.4\n'); offsets = [0]
for i, obj in enumerate(objects, 1): offsets.append(len(out)); out.extend(f'{i} 0 obj\n'.encode()); out.extend(obj); out.extend(b'\nendobj\n')
xref = len(out); out.extend(f'xref\n0 {len(objects)+1}\n'.encode()); out.extend(b'0000000000 65535 f \n')
for off in offsets[1:]: out.extend(f'{off:010d} 00000 n \n'.encode())
out.extend(f'trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode())
Path('.runtime/test-artifacts/synthetic-profile.pdf').write_bytes(out); print(len(out))
