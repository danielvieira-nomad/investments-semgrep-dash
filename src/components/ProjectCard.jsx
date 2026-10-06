import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { SeverityChips } from './SeverityChips'
import { toRepoSlug } from '../utils/repoSlug'

export function ProjectCard({ project }) {
  const navigate = useNavigate()
  const slug = toRepoSlug(project.repositoryName)

  return (
    <Card variant="outlined">
      <CardActionArea onClick={() => navigate(`/project/${slug}`)}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} noWrap title={project.repositoryName}>
            {project.repositoryName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {project.findings.length} findings
          </Typography>
          <SeverityChips counts={project.severityCounts} />
          {project.repositoryUrl ? (
            <Link
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              sx={{ display: 'block', mt: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              Repository
            </Link>
          ) : null}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
